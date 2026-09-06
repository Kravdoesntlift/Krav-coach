import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * One place that knows how to make the database agree with Stripe.
 *
 * This logic used to exist three times: in the webhook, in the nightly
 * reconcile, and in the post-checkout landing page: and the three copies had
 * drifted: the landing page set `status` but never `subscription_renews_at`,
 * and only the webhook cleared `trial_ends_at`. Which fields a paying client
 * ended up with depended on which path happened to run first.
 */

type Admin = ReturnType<typeof createAdminClient>;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 2,
  });
}

/** Stripe subscription status → the value `profiles.status` should hold. */
export function profileStatusFor(stripeStatus: string): string | null {
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

/** Statuses that still grant access to the app. */
export const LIVE_STATUSES = ["active", "trialing"] as const;

/**
 * The period end lives on the subscription *item*, not the subscription, since
 * the 2025 API versions moved it.
 */
export function periodEndOf(subscription: Stripe.Subscription): string | null {
  const ts = subscription.items.data[0]?.current_period_end ?? null;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

/**
 * `profiles.subscription_renews_at` is a `date` column while
 * `stripe_subscriptions.current_period_end` is a `timestamptz`. Writing a full
 * ISO string to the date column silently truncates it, so every later
 * comparison of the two ("has this changed?") saw a difference that was not
 * really there and rewrote the row on every single reconcile pass. Store the
 * date column as a date and compare like with like.
 */
export function toDateOnly(iso: string | null): string | null {
  return iso ? iso.slice(0, 10) : null;
}

export function customerIdOf(subscription: Stripe.Subscription): string | null {
  const c = subscription.customer;
  return typeof c === "string" ? c : c?.id ?? null;
}

/**
 * Write a Stripe subscription into the database: the subscription row, the
 * client's profile, and the coach assignment.
 *
 * Returns whether anything actually changed, so callers can tell a real repair
 * from a no-op. Never throws: billing sync failing loudly in a page render is
 * worse than it failing quietly and being retried by the nightly job.
 */
export async function syncSubscription(
  admin: Admin,
  args: {
    subscription: Stripe.Subscription;
    clientId: string;
    coachId?: string | null;
  },
): Promise<{ changed: boolean; errors: string[] }> {
  const { subscription, clientId, coachId } = args;
  const errors: string[] = [];
  let changed = false;

  const amountCents = subscription.items.data[0]?.price?.unit_amount ?? null;
  const periodEnd = periodEndOf(subscription);
  const renewsAt = toDateOnly(periodEnd);
  const customerId = customerIdOf(subscription);
  const wantStatus = profileStatusFor(subscription.status);
  const isLive = (LIVE_STATUSES as readonly string[]).includes(subscription.status);

  // ── Subscription row ────────────────────────────────────────────────────────
  const { data: dbSub } = await admin
    .from("stripe_subscriptions")
    .select("status, current_period_end, coach_id, amount_cents")
    .eq("id", subscription.id)
    .maybeSingle();

  const subDiffers =
    !dbSub ||
    dbSub.status !== subscription.status ||
    dbSub.amount_cents !== amountCents ||
    // timestamptz comes back as "+00:00", toISOString() ends in "Z": compare instants
    (dbSub.current_period_end ? new Date(dbSub.current_period_end).getTime() : null) !==
      (periodEnd ? new Date(periodEnd).getTime() : null);

  if (subDiffers) {
    const { error } = await admin.from("stripe_subscriptions").upsert(
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
    if (error) errors.push(`stripe_subscriptions: ${error.message}`);
    else changed = true;
  }

  // ── Profile ─────────────────────────────────────────────────────────────────
  const { data: dbProfile } = await admin
    .from("profiles")
    .select("status, subscription_renews_at, trial_ends_at, stripe_customer_id")
    .eq("id", clientId)
    .maybeSingle();

  const profileDiffers =
    !dbProfile ||
    (wantStatus !== null && dbProfile.status !== wantStatus) ||
    dbProfile.subscription_renews_at !== renewsAt ||
    (isLive && dbProfile.trial_ends_at !== null) ||
    (customerId !== null && dbProfile.stripe_customer_id !== customerId);

  if (profileDiffers) {
    const { error } = await admin
      .from("profiles")
      .update({
        ...(wantStatus ? { status: wantStatus } : {}),
        subscription_renews_at: renewsAt,
        // A real subscription supersedes any trial countdown
        ...(isLive ? { trial_ends_at: null } : {}),
        ...(customerId ? { stripe_customer_id: customerId } : {}),
      })
      .eq("id", clientId);
    if (error) errors.push(`profiles: ${error.message}`);
    else changed = true;
  }

  // ── Coach assignment ────────────────────────────────────────────────────────
  // A paying client with no assignment is invisible in the dashboard and the
  // analytics, which is how a subscriber can pay and appear not to exist.
  if (isLive && coachId) {
    const { data: link } = await admin
      .from("coach_clients")
      .select("coach_id")
      .eq("client_id", clientId)
      .eq("coach_id", coachId)
      .maybeSingle();

    if (!link) {
      const { error } = await admin.from("coach_clients").upsert(
        { coach_id: coachId, client_id: clientId, assigned_role: "coach" },
        { onConflict: "coach_id,client_id,assigned_role" },
      );
      if (error) errors.push(`coach_clients: ${error.message}`);
      else changed = true;
    }
  }

  if (errors.length) console.error("[billing/sync]", subscription.id, errors);
  return { changed, errors };
}

// ─── On-demand self-heal ──────────────────────────────────────────────────────

/**
 * Stripe is asked about a subscription at most once per this window, so a
 * subscription that is legitimately stuck in the past (an unpaid one, say)
 * cannot turn every page render into a Stripe API call.
 */
const RECHECK_COOLDOWN_MS = 10 * 60 * 1000;
const lastChecked = new Map<string, number>();

/**
 * Refresh any subscription whose stored period has already elapsed.
 *
 * The nightly reconcile is the backstop, but it leaves a window of up to 24
 * hours in which a client who has just been charged still looks unpaid: which
 * is exactly what the coach sees when they open the dashboard the morning
 * after a renewal. This closes that window: if the stored period end is in the
 * past, ask Stripe before drawing anything.
 *
 * Safe to call on every render. It does nothing at all in the normal case,
 * because a subscription whose period is still in the future is never selected.
 */
export async function healStaleSubscriptions(
  scope: { coachId?: string; clientId?: string } = {},
): Promise<number> {
  const stripe = getStripe();
  if (!stripe) return 0;

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  let query = admin
    .from("stripe_subscriptions")
    .select("id, client_id, coach_id")
    // A cancelled row is not "stale", it is settled: re-asking Stripe about it
    // on every render would be pure noise.
    .in("status", ["active", "trialing", "past_due"])
    .lt("current_period_end", nowIso)
    .limit(25);

  if (scope.coachId) query = query.eq("coach_id", scope.coachId);
  if (scope.clientId) query = query.eq("client_id", scope.clientId);

  const { data: stale, error } = await query;
  if (error || !stale?.length) return 0;

  const now = Date.now();
  let healed = 0;

  await Promise.all(
    stale.map(async (row) => {
      const seen = lastChecked.get(row.id);
      if (seen && now - seen < RECHECK_COOLDOWN_MS) return;
      lastChecked.set(row.id, now);

      try {
        const subscription = await stripe.subscriptions.retrieve(row.id);
        const { changed } = await syncSubscription(admin, {
          subscription,
          clientId: row.client_id,
          coachId: row.coach_id,
        });
        if (changed) healed++;
      } catch (e) {
        // A subscription Stripe no longer knows about, or a transient network
        // failure. Either way the nightly reconcile handles it; a page render
        // must not fail because of it.
        console.error("[billing/heal]", row.id, e instanceof Error ? e.message : e);
      }
    }),
  );

  return healed;
}
