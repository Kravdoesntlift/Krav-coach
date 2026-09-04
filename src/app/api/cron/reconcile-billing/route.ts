import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { syncSubscription, getStripe } from "@/lib/billing/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/reconcile-billing
 *
 * Safety net for the Stripe webhook. Webhooks can be missed — a deploy window,
 * a Stripe retry that exhausts, a signature mismatch, a payment made outside our
 * checkout flow. This walks every Stripe subscription nightly and makes the
 * database match reality, so a missed event self-heals within 24h instead of
 * needing someone to notice a client is stuck.
 *
 * Idempotent: writes only where Stripe and the DB actually disagree.
 */

/** Allow the Vercel cron (Bearer secret) or a signed-in coach running it manually. */
async function isAuthorised(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`) return true;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    return profile?.role === "coach";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorised(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const admin = createAdminClient();

  const report = {
    scanned: 0,
    repaired: 0,
    unmatched: [] as string[],
    stale: [] as string[],
    errors: [] as string[],
    // How long the Stripe webhook has been silent. Every subscription in this
    // database was written by this job rather than by an event, which is only
    // visible if someone thinks to look — so the job says it out loud.
    webhook: { lastEventAt: null as string | null, silentDays: null as number | null, healthy: true },
  };
  const seenInStripe = new Set<string>();

  // The platform's coach — used when a subscription has no assignment yet
  const { data: coachRow } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "coach")
    .limit(1)
    .maybeSingle();
  const fallbackCoachId = coachRow?.id ?? null;

  // Cache auth users once — matching by email is the last-resort lookup
  let authUsers: { id: string; email?: string }[] = [];
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    authUsers = (data?.users ?? []).map((u) => ({ id: u.id, email: u.email ?? undefined }));
  } catch (e) {
    report.errors.push(`listUsers: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    for await (const subscription of stripe.subscriptions.list({ status: "all", limit: 100 })) {
      report.scanned++;
      seenInStripe.add(subscription.id);

      try {
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id ?? null;

        // ── Resolve the client ───────────────────────────────────────────────
        let clientId: string | null = subscription.metadata?.client_id ?? null;

        if (!clientId) {
          const { data: known } = await admin
            .from("stripe_subscriptions")
            .select("client_id")
            .eq("id", subscription.id)
            .maybeSingle();
          clientId = known?.client_id ?? null;
        }

        if (!clientId && customerId) {
          const { data: byCustomer } = await admin
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          clientId = byCustomer?.id ?? null;
        }

        if (!clientId && customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          if (!customer.deleted) {
            clientId = customer.metadata?.client_id ?? null;
            if (!clientId && customer.email) {
              const match = authUsers.find(
                (u) => u.email?.toLowerCase() === customer.email!.toLowerCase(),
              );
              clientId = match?.id ?? null;
            }
          }
        }

        if (!clientId) {
          report.unmatched.push(subscription.id);
          continue;
        }

        // ── Make the DB agree with Stripe ────────────────────────────────────
        const [{ data: dbSub }, { data: dbLink }] = await Promise.all([
          admin
            .from("stripe_subscriptions")
            .select("coach_id")
            .eq("id", subscription.id)
            .maybeSingle(),
          admin
            .from("coach_clients")
            .select("coach_id")
            .eq("client_id", clientId)
            .maybeSingle(),
        ]);

        const coachId =
          dbSub?.coach_id ?? dbLink?.coach_id ?? subscription.metadata?.coach_id ?? fallbackCoachId;

        const { changed, errors } = await syncSubscription(admin, {
          subscription,
          clientId,
          coachId,
        });
        if (errors.length) report.errors.push(`${subscription.id}: ${errors.join("; ")}`);
        if (changed) report.repaired++;
      } catch (e) {
        report.errors.push(`${subscription.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    report.errors.push(`list: ${e instanceof Error ? e.message : String(e)}`);
    // The Stripe listing is incomplete — skip stale detection entirely rather
    // than mistake "not fetched" for "no longer exists".
    return NextResponse.json(report);
  }

  // Rows the database believes are live but Stripe has never heard of. Left
  // alone these keep granting access to someone who is not paying. Mark them
  // cancelled rather than deleting, so the history stays auditable.
  try {
    const { data: dbRows } = await admin
      .from("stripe_subscriptions")
      .select("id, status")
      .in("status", ["active", "trialing", "past_due"]);

    for (const row of dbRows ?? []) {
      if (seenInStripe.has(row.id)) continue;
      await admin.from("stripe_subscriptions").update({ status: "cancelled" }).eq("id", row.id);
      report.stale.push(row.id);
      report.repaired++;
    }
  } catch (e) {
    report.errors.push(`stale-sweep: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── Is the webhook actually alive? ──────────────────────────────────────────
  // A misconfigured endpoint URL or signing secret fails silently: Stripe marks
  // the deliveries as failed on its own dashboard and the app never hears a
  // thing. The only symptom is that renewals take up to a day to show, which
  // reads as "the app is buggy" rather than "the webhook is down".
  try {
    const { data: lastEvent } = await admin
      .from("stripe_processed_events")
      .select("processed_at")
      .order("processed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastAt = lastEvent?.processed_at ?? null;
    report.webhook.lastEventAt = lastAt;

    if (report.scanned > 0) {
      const silentMs = lastAt ? Date.now() - new Date(lastAt).getTime() : Infinity;
      const silentDays = Number.isFinite(silentMs) ? Math.floor(silentMs / 86400000) : null;
      report.webhook.silentDays = silentDays;
      // Monthly subscriptions mean a healthy webhook can legitimately be quiet
      // for a few days; a week of silence with live subscriptions is not normal.
      report.webhook.healthy = silentMs < 7 * 86400000;

      if (!report.webhook.healthy) {
        console.error(
          "[reconcile-billing] STRIPE WEBHOOK SILENT —",
          lastAt ? `last event ${silentDays} days ago` : "no event has EVER been received",
          "— billing is running on this nightly job alone. Check the endpoint URL and signing secret in the Stripe dashboard.",
        );
      }
    }
  } catch (e) {
    report.errors.push(`webhook-health: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (
    report.repaired ||
    report.unmatched.length ||
    report.stale.length ||
    report.errors.length ||
    !report.webhook.healthy
  ) {
    console.log("[reconcile-billing]", JSON.stringify(report));
  }

  return NextResponse.json(report);
}
