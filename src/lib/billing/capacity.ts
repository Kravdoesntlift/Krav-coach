import type { SupabaseClient } from "@supabase/supabase-js";
import { tierForAmount } from "./tiers";

/**
 * How many 1:1 clients there is room for.
 *
 * This is the one scarcity in the business that is real: the app and the book
 * cost nothing per extra customer, but a plan written by hand every week costs
 * hours, and there are only so many hours. Everything here is counted from the
 * live subscriptions, so the number on the page is never a number somebody
 * typed in to create pressure.
 */
export const COACHING_CAPACITY = 8;

/**
 * Below this, the page says how many are left. Above it, it says nothing.
 *
 * An empty calendar is not a selling point, and "7 of 8 places available"
 * tells a prospect that nobody else is buying. Staying quiet while there is
 * room is honest; inventing a queue would not be.
 */
export const SCARCITY_THRESHOLD = 3;

export interface CoachingCapacity {
  capacity: number;
  taken: number;
  left: number;
  /** Whether the number is worth showing at all. */
  show: boolean;
}

export async function coachingCapacity(
  admin: SupabaseClient,
): Promise<CoachingCapacity> {
  const { data } = await admin
    .from("stripe_subscriptions")
    .select("amount_cents, status")
    .in("status", ["active", "trialing"]);

  const taken = (data ?? []).filter(
    (s) => tierForAmount(s.amount_cents as number | null) === "coaching",
  ).length;

  const left = Math.max(0, COACHING_CAPACITY - taken);
  return { capacity: COACHING_CAPACITY, taken, left, show: left <= SCARCITY_THRESHOLD };
}
