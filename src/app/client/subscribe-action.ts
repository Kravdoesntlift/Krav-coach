"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TIERS, isTier, tierAmount, type Tier } from "@/lib/billing/tiers";

/**
 * Start a subscription, in the tier the person chose.
 *
 * It lives here rather than in the layout because two places need it: the
 * paywall at the end of the trial, and the plans page someone can open while
 * the trial is still running.
 */
export async function subscribeAction(formData: FormData) {
  // Which of the two was pressed. Anything unexpected means coaching, never
  // the cheaper one: charging someone less than they chose is the mistake
  // that is hard to undo.
  const raw = formData.get("tier");
  const tier: Tier = isTier(raw) ? raw : "coaching";

  // No Stripe key → fall back to Instagram contact
  if (!process.env.STRIPE_SECRET_KEY) {
    redirect("https://instagram.com/kravdoesntlift");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const [{ data: profile }, { data: coachLink }, { data: authUser }] = await Promise.all([
    admin.from("profiles").select("stripe_customer_id, full_name").eq("id", user.id).single(),
    admin.from("coach_clients").select("coach_id").eq("client_id", user.id).maybeSingle(),
    admin.auth.admin.getUserById(user.id),
  ]);

  const coachId = coachLink?.coach_id ?? "";
  const email = authUser?.user?.email ?? "";

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
  });

  let stripeCustomerId = profile?.stripe_customer_id ?? "";
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email,
      name: profile?.full_name ?? "",
      metadata: { client_id: user.id, coach_id: coachId },
    });
    stripeCustomerId = customer.id;
    await admin.from("profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", user.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kravcoaching.com";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "eur",
        product_data: { name: TIERS[tier].productName },
        unit_amount: tierAmount(tier),
        recurring: { interval: "month" },
      },
      quantity: 1,
    }],
    // The tier travels with the subscription too, so a report or a later
    // column can read it without guessing from the amount.
    metadata: { coach_id: coachId, client_id: user.id, tier },
    subscription_data: { metadata: { coach_id: coachId, client_id: user.id, tier } },
    success_url: `${siteUrl}/client/pending?welcome=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/client/dashboard`,
  });

  redirect(session.url!);
}
