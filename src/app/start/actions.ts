"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  goal: string;
  level: string;
  availableDays: number;
  injuries: string;
}

export interface SignupResult {
  checkoutUrl?: string;
  error?: string;
}

export async function signupAndStartCheckout(
  payload: SignupPayload
): Promise<SignupResult> {
  const { fullName, email, password, goal, level, availableDays, injuries } = payload;

  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Stripe não configurado." };
  }

  const admin = createAdminClient();

  // 1. Find the coach
  const { data: coachProfile, error: coachErr } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "coach")
    .limit(1)
    .maybeSingle();

  if (coachErr || !coachProfile) {
    return { error: "Coach não encontrado. Contacta o suporte." };
  }
  const coachId = coachProfile.id as string;

  // 2. Create user via admin (email_confirm: true = no email verification needed)
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "client" },
  });

  if (authErr || !authData.user) {
    const msg = authErr?.message ?? "Erro ao criar conta.";
    if (msg.toLowerCase().includes("already")) {
      return { error: "Este email já tem uma conta. Tenta entrar." };
    }
    return { error: msg };
  }
  const clientId = authData.user.id;

  // 3. Save onboarding data
  // Map availableDays count → array [0..availableDays-1]
  const days = Array.from({ length: availableDays }, (_, i) => i);

  await admin.from("client_onboarding").upsert(
    {
      client_id: clientId,
      goal,
      level,
      available_days: days,
      injuries: injuries || null,
    },
    { onConflict: "client_id" }
  );

  // 4. Create Stripe customer + checkout session
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
  });

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: fullName,
    metadata: { client_id: clientId, coach_id: coachId },
  });
  const stripeCustomerId = customer.id;

  // Persist stripe_customer_id on profile
  await admin
    .from("profiles")
    .update({ stripe_customer_id: stripeCustomerId })
    .eq("id", clientId);

  const siteUrl = (() => {
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    if (envUrl.startsWith("http")) return envUrl.replace(/\/$/, "");
    return "http://localhost:3000";
  })();

  // 5. Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: "KRAV Premium Coaching" },
          unit_amount: 12700, // €127.00
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    metadata: {
      coach_id: coachId,
      client_id: clientId,
      self_service: "true",
    },
    success_url: `${siteUrl}/client/pending?welcome=true`,
    cancel_url: `${siteUrl}/start`,
  });

  return { checkoutUrl: session.url ?? undefined };
}
