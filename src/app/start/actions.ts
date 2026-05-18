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

  // 4. Create Stripe customer + checkout session
  //    If Stripe fails we clean up the Supabase account so no orphan client appears
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 1,
  });

  let stripeCustomerId: string;
  let checkoutUrl: string;

  try {
    const customer = await stripe.customers.create({
      email,
      name: fullName,
      metadata: { client_id: clientId, coach_id: coachId },
    });
    stripeCustomerId = customer.id;

    await admin
      .from("profiles")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", clientId);

    const siteUrl = (() => {
      const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      if (envUrl.startsWith("http")) return envUrl.replace(/\/$/, "");
      return "http://localhost:3000";
    })();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "KRAV Premium Coaching" },
            unit_amount: 12700,
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
      success_url: `${siteUrl}/client/pending?welcome=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/start`,
    });

    checkoutUrl = session.url!;
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
