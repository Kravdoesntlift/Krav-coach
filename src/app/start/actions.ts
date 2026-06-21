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
  redirectTo?: string;
  error?: string;
}

export async function signupAndStartCheckout(
  payload: SignupPayload
): Promise<SignupResult> {
  try {
    return await _signupAndTrial(payload);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[signupAndTrial] unhandled error:", msg);
    return { error: "Ocorreu um erro inesperado. Tenta novamente." };
  }
}

async function _signupAndTrial(
  payload: SignupPayload
): Promise<SignupResult> {
  const { fullName, email, password, goal, level, availableDays, injuries, equipment } = payload;

  const admin = createAdminClient();

  // 1. Find the coach
  const { data: coachProfile, error: coachErr } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("role", "coach")
    .limit(1)
    .maybeSingle();

  if (coachErr || !coachProfile) {
    return { error: "Coach não encontrado. Contacta o suporte." };
  }
  const coachId = coachProfile.id as string;

  // 2. Create user (email_confirm: true = no verification email needed)
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

  // 3. Set active + 7-day trial
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await admin.from("profiles").update({ status: "active", trial_ends_at: trialEndsAt }).eq("id", clientId);

  // 4. Save onboarding data
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

  // 5. Assign coach
  await admin.from("coach_clients").upsert(
    { coach_id: coachId, client_id: clientId, assigned_role: "coach" },
    { onConflict: "coach_id,client_id,assigned_role" }
  );

  // 6. Sign user in (sets browser session cookie)
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) {
    console.error("[signupAndTrial] signIn failed:", signInErr.message);
  }

  // 7. Welcome message from coach
  const clientFirstName = fullName.split(" ")[0] || "atleta";
  const coachFirstName  = ((coachProfile.full_name as string | null) ?? "").split(" ")[0] || "Coach";
  await admin.from("messages").insert({
    sender_id:   coachId,
    receiver_id: clientId,
    content: `Olá ${clientFirstName}! 👋 Sou o ${coachFirstName}. Bem-vindo ao teu trial de 7 dias! Tens acesso completo à app durante esta semana. Explora os treinos, regista os teus check-ins e fala comigo por aqui se tiveres alguma dúvida. Vamos a isso! 💪`,
  });

  // 8. Push notification to coach
  try {
    const { sendPushToUser } = await import("@/lib/push");
    await sendPushToUser(
      coachId,
      "🆕 Novo cliente em trial!",
      `${fullName} acabou de criar conta. Trial de 7 dias ativo.`,
      "/coach/manage-clients",
    );
  } catch (e) {
    console.warn("[signupAndTrial] Push to coach failed:", e);
  }

  // 9. Welcome email
  try {
    const { sendWelcomeEmail } = await import("@/lib/email");
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    await sendWelcomeEmail({
      to:         email,
      clientName: fullName,
      coachName:  coachProfile.full_name as string ?? "Coach",
      siteUrl,
    });
  } catch (e) {
    console.warn("[signupAndTrial] Welcome email failed:", e);
  }

  return { redirectTo: "/client/dashboard" };
}
