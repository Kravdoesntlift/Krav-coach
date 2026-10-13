import { createAdminClient } from "@/lib/supabase/admin";
import { EBOOK } from "@/lib/ebook/content";

/**
 * What each week actually produced, side by side.
 *
 * The coach is about to spend months making content and had no way to tell a
 * reel that brought three leads from one that brought none. Everything here is
 * counted from the thing itself: leads from the leads table, book sales from
 * Stripe, trials from the accounts created, subscriptions from the rows the
 * billing sync writes. Nothing is estimated and nothing is typed in by hand.
 */

export interface FunnelWeek {
  /** Monday, YYYY-MM-DD. */
  weekStart: string;
  leads: number;
  /** Null when Stripe could not be read: an unknown is not a zero. */
  books: number | null;
  trials: number;
  subscriptions: number;
}

export interface WeeklyFunnel {
  rows: FunnelWeek[];
  /** False when the book column is guesswork rather than data. */
  stripeRead: boolean;
}

function mondayOf(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function weeklyFunnel(weeks = 8): Promise<WeeklyFunnel> {
  const admin = createAdminClient();

  const thisMonday = mondayOf(new Date());
  const firstMonday = addDays(thisMonday, -(weeks - 1) * 7);
  const sinceIso = firstMonday + "T00:00:00Z";

  const [{ data: leads }, { data: clients }, { data: subs }] = await Promise.all([
    admin.from("leads").select("created_at").gte("created_at", sinceIso),
    admin.from("profiles").select("created_at").eq("role", "client").gte("created_at", sinceIso),
    admin
      .from("stripe_subscriptions")
      .select("created_at, amount_cents")
      .gte("created_at", sinceIso),
  ]);

  // Book sales come from Stripe, because nothing on our side records a
  // purchase: delivery is a signed link and the buyer never gets an account.
  let books: Map<string, number> | null = null;
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
      });
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: Math.floor(new Date(sinceIso).getTime() / 1000) },
      });
      books = new Map();
      for (const s of sessions.data) {
        if (s.payment_status !== "paid") continue;
        if (s.metadata?.product !== EBOOK.id) continue;
        const week = mondayOf(new Date(s.created * 1000));
        books.set(week, (books.get(week) ?? 0) + 1);
      }
    }
  } catch (e) {
    console.error("[weekly-funnel] Stripe could not be read:", e);
    books = null;
  }

  const countByWeek = (rows: { created_at: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) {
      const week = mondayOf(new Date(r.created_at));
      m.set(week, (m.get(week) ?? 0) + 1);
    }
    return m;
  };

  const leadsByWeek = countByWeek(leads as { created_at: string }[] | null);
  const trialsByWeek = countByWeek(clients as { created_at: string }[] | null);
  const subsByWeek = countByWeek(
    ((subs ?? []) as { created_at: string; amount_cents: number | null }[])
      .filter((s) => (s.amount_cents ?? 0) > 0),
  );

  const rows: FunnelWeek[] = Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(firstMonday, i * 7);
    return {
      weekStart,
      leads: leadsByWeek.get(weekStart) ?? 0,
      books: books ? books.get(weekStart) ?? 0 : null,
      trials: trialsByWeek.get(weekStart) ?? 0,
      subscriptions: subsByWeek.get(weekStart) ?? 0,
    };
  });

  return { rows, stripeRead: books !== null };
}
