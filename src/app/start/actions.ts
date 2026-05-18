"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  goal: string;
  level: string;
  availableDays: number;
  injuries: string;
  equipment: string;
}

export interface SignupResult {
  checkoutUrl?: string;
  error?: string;
}

export async function signupAndStartCheckout(
  payload: SignupPayload
): Promise<SignupResult> {
  try {
    return await _signupAndStartCheckout(payload);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[signupAndStartCheckout] unhandled error:", msg);
    // Surface a readable message — hide internal details
    if (msg.toLowerCase().includes("stripe") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("connect")) {
      return { error: "Erro ao ligar ao sistema de pagamento. Tenta novamente em alguns segundos." };
    }
    return { error: "Ocorreu um erro inesperado. Tenta novamente." };
  }
}

async function _signupAndStartCheckout(
  payload: SignupPayload
): Promise<SignupResult> {
  const { fullName, email, password, goal, level, availableDays, injuries, equipment } = payload;

  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Sistema de pagamento não configurado. Contacta o suporte." };
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
      return { error: "Este email já tem uma conta. Tenta entrar em kravcoaching.com/auth/login" };
    }
    return { error: `Erro ao criar conta: ${msg}` };
  }
  const clientId = authData.user.id;

  // 3. Save onboarding data
  const days = Array.from({ length: availableDays }, (_, i) => i);
  await admin.from("client_onboarding").upsert(
    {
      client_id: clientId,
      goal,
      level,
      available_days: days,
      injuries: injuries || null,
      goals_text: goal,
      fitness_level: level,
      availability: availableDays,
      equipment,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "client_id" }
  );

  // 3b. Sign user in so browser session cookie is set before Stripe redirect
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) {
    console.error("[signup] signIn after createUser failed:", signInErr.message);
  }

  // 4. Create Stripe customer + checkout session via raw fetch (no SDK)
  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY!;
  const stripeHeaders = {
    Authorization: `Bearer ${STRIPE_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const siteUrl = (() => {
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    if (envUrl.startsWith("http")) return envUrl.replace(/\/$/, "");
    return "http://localhost:3000";
  })();

  let stripeCustomerId: string;
  let checkoutUrl: string;

  try {
    // 4a. Create customer
    const custParams = new URLSearchParams({
      email,
      name: fullName,
      "metadata[client_id]": clientId,
      "metadata[coach_id]": coachId,
    });
    const custResp = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: stripeHeaders,
      body: custParams.toString(),
      signal: AbortSignal.timeout(15000),
    });
    const custBody = await custResp.json() as { id?: string; error?: { message: string } };
    if (!custResp.ok || !custBody.id) {
      throw new Error(`Stripe customer error (${custResp.status}): ${custBody.error?.message ?? JSON.stringify(custBody)}`);
    }
    stripeCustomerId = custBody.id;

    await admin.from("profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", clientId);

    // 4b. Create checkout session
    const sessionParams = new URLSearchParams({
      mode: "subscription",
      customer: stripeCustomerId,
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][product_data][name]": "KRAV Premium Coaching",
      "line_items[0][price_data][unit_amount]": "12700",
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][quantity]": "1",
      "metadata[coach_id]": coachId,
      "metadata[client_id]": clientId,
      "metadata[self_service]": "true",
      success_url: `${siteUrl}/client/pending?welcome=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/start`,
    });
    const sessResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: stripeHeaders,
      body: sessionParams.toString(),
      signal: AbortSignal.timeout(15000),
    });
    const sessBody = await sessResp.json() as { url?: string; error?: { message: string } };
    if (!sessResp.ok || !sessBody.url) {
      throw new Error(`Stripe session error (${sessResp.status}): ${sessBody.error?.message ?? JSON.stringify(sessBody)}`);
    }
    checkoutUrl = sessBody.url;

  } catch (stripeErr: unknown) {
    // Stripe failed — delete the Supabase account so no orphan client appears
    await admin.auth.admin.deleteUser(clientId).catch(() => {});
    const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
    console.error("[signup] Stripe error:", msg);

    if (msg.includes("charges_enabled") || msg.includes("live") || msg.includes("activate")) {
      return { error: "O sistema de pagamento ainda não está ativo. Contacta o suporte." };
    }
    throw stripeErr; // re-throw so outer catch handles it
  }

  // 5. Coach_clients assignment only after Stripe checkout is ready
  //    (payment hasn't happened yet — pending page will do the full activation)
  //    We set it here so the client sees their coach immediately after paying.
  await admin.from("coach_clients").upsert(
    { coach_id: coachId, client_id: clientId, assigned_role: "coach" },
    { onConflict: "coach_id,client_id,assigned_role" }
  );

  return { checkoutUrl };
}
