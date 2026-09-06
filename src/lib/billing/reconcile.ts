import { createAdminClient } from "@/lib/supabase/admin";
import { syncSubscription, getStripe } from "@/lib/billing/sync";

/**
 * Walk every Stripe subscription and make the database match it.
 *
 * Safety net for the Stripe webhook. Webhooks get missed: a deploy window, a
 * signature mismatch, an endpoint URL that redirects, a payment made outside
 * our checkout. This runs nightly so a missed event self-heals instead of
 * needing someone to notice a client is stuck, and it is also what the
 * "Sincronizar agora" button on the billing page calls.
 *
 * Idempotent: writes only where Stripe and the DB actually disagree, so
 * `repaired: 0` is a genuine "nothing was wrong".
 */

export interface ReconcileReport {
  scanned: number;
  repaired: number;
  unmatched: string[];
  stale: string[];
  errors: string[];
  webhook: WebhookHealth;
}

export interface WebhookHealth {
  lastEventAt: string | null;
  silentDays: number | null;
  /** False once live subscriptions exist but no event has arrived in a week. */
  healthy: boolean;
  /** True when no event has *ever* been received: a never-configured endpoint. */
  neverReceived: boolean;
}

/**
 * How long has the Stripe webhook been silent?
 *
 * A misconfigured endpoint fails invisibly: Stripe records the failed delivery
 * on its own dashboard and the app hears nothing at all. The only symptom is
 * that renewals take up to a day to appear, which reads as "the app is buggy"
 * rather than "the webhook is down". Cheap enough to call on a page render.
 */
export async function getWebhookHealth(hasLiveSubscriptions = true): Promise<WebhookHealth> {
  const admin = createAdminClient();

  const { data: lastEvent } = await admin
    .from("stripe_processed_events")
    .select("processed_at")
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastAt = lastEvent?.processed_at ?? null;
  const silentMs = lastAt ? Date.now() - new Date(lastAt).getTime() : Infinity;

  return {
    lastEventAt: lastAt,
    silentDays: Number.isFinite(silentMs) ? Math.floor(silentMs / 86_400_000) : null,
    // Monthly billing means a healthy webhook can legitimately be quiet for a
    // few days; a week of silence while subscriptions exist is not normal.
    healthy: hasLiveSubscriptions ? silentMs < 7 * 86_400_000 : true,
    neverReceived: lastAt === null,
  };
}

export async function reconcileBilling(): Promise<ReconcileReport | { error: string }> {
  const stripe = getStripe();
  if (!stripe) return { error: "Stripe not configured" };

  const admin = createAdminClient();

  const report: ReconcileReport = {
    scanned: 0,
    repaired: 0,
    unmatched: [],
    stale: [],
    errors: [],
    webhook: { lastEventAt: null, silentDays: null, healthy: true, neverReceived: true },
  };
  const seenInStripe = new Set<string>();

  // The platform's coach: used when a subscription has no assignment yet
  const { data: coachRow } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "coach")
    .limit(1)
    .maybeSingle();
  const fallbackCoachId = coachRow?.id ?? null;

  // Cache auth users once: matching by email is the last-resort lookup
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
    // The Stripe listing is incomplete: skip the stale sweep entirely rather
    // than mistake "not fetched" for "no longer exists" and revoke live access.
    return report;
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

  try {
    report.webhook = await getWebhookHealth(report.scanned > 0);
    if (!report.webhook.healthy) {
      console.error(
        "[reconcile-billing] STRIPE WEBHOOK SILENT:",
        report.webhook.neverReceived
          ? "no event has EVER been received"
          : `last event ${report.webhook.silentDays} days ago`,
        "Billing is running on the nightly job alone. Check the endpoint URL and signing secret in the Stripe dashboard.",
      );
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

  return report;
}
