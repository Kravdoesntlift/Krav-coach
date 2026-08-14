import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

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

function profileStatusFor(stripeStatus: string): string | null {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "cancelled";
    default:
      return null;
  }
}

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
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
  const admin = createAdminClient();

  const report = {
    scanned: 0,
    repaired: 0,
    unmatched: [] as string[],
    stale: [] as string[],
    errors: [] as string[],
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

        // ── Compare against what the DB believes ─────────────────────────────
        const item = subscription.items.data[0];
        const amountCents = item?.price?.unit_amount ?? null;
        const periodEndTs = item?.current_period_end ?? null;
        const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;

        const [{ data: dbSub }, { data: dbProfile }, { data: dbLink }] = await Promise.all([
          admin
            .from("stripe_subscriptions")
            .select("status, current_period_end, coach_id")
            .eq("id", subscription.id)
            .maybeSingle(),
          admin
            .from("profiles")
            .select("status, subscription_renews_at, trial_ends_at, stripe_customer_id")
            .eq("id", clientId)
            .maybeSingle(),
          admin
            .from("coach_clients")
            .select("coach_id")
            .eq("client_id", clientId)
            .maybeSingle(),
        ]);

        const coachId = dbSub?.coach_id ?? dbLink?.coach_id ?? subscription.metadata?.coach_id ?? fallbackCoachId;
        const wantStatus = profileStatusFor(subscription.status);
        const isLive = subscription.status === "active" || subscription.status === "trialing";

        let didRepair = false;

        // Subscription row missing or stale
        if (
          !dbSub ||
          dbSub.status !== subscription.status ||
          dbSub.current_period_end !== periodEnd
        ) {
          await admin.from("stripe_subscriptions").upsert(
            {
              id: subscription.id,
              client_id: clientId,
              ...(coachId ? { coach_id: coachId } : {}),
              status: subscription.status,
              amount_cents: amountCents,
              current_period_end: periodEnd,
            },
            { onConflict: "id" },
          );
          didRepair = true;
        }

        // Profile out of sync with billing reality
        const profileNeedsFix =
          !dbProfile ||
          (wantStatus && dbProfile.status !== wantStatus) ||
          dbProfile.subscription_renews_at !== periodEnd ||
          (isLive && dbProfile.trial_ends_at !== null) ||
          (customerId && dbProfile.stripe_customer_id !== customerId);

        if (profileNeedsFix) {
          await admin
            .from("profiles")
            .update({
              ...(wantStatus ? { status: wantStatus } : {}),
              subscription_renews_at: periodEnd,
              ...(isLive ? { trial_ends_at: null } : {}),
              ...(customerId ? { stripe_customer_id: customerId } : {}),
            })
            .eq("id", clientId);
          didRepair = true;
        }

        // Paying client never assigned to the coach → invisible in dashboard/analytics
        if (isLive && coachId && !dbLink) {
          await admin.from("coach_clients").upsert(
            { coach_id: coachId, client_id: clientId, assigned_role: "coach" },
            { onConflict: "coach_id,client_id,assigned_role" },
          );
          didRepair = true;
        }

        if (didRepair) report.repaired++;
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

  if (report.repaired || report.unmatched.length || report.stale.length || report.errors.length) {
    console.log("[reconcile-billing]", JSON.stringify(report));
  }

  return NextResponse.json(report);
}
