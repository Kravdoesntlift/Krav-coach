"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: "Email ou password incorretos." };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Erro de autenticação." };

  let { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // ── Auto-repair: profile was deleted but auth user still exists ────────────
  if (!profile) {
    const { data: inserted } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split("@")[0] ??
          "Utilizador",
        role: (user.user_metadata?.role as string | undefined) ?? "client",
      })
      .select("role")
      .single();
    profile = inserted;
  }

  revalidatePath("/", "layout");
  return { role: profile?.role ?? "client" };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const fullName = (formData.get("full_name") as string).trim();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const coachId = (formData.get("coach_id") as string | null)?.trim() || null;
  const refCode = (formData.get("ref_code") as string | null)?.trim().toUpperCase() || null;
  const lang = (formData.get("lang") as string | null) === "en" ? "en" : "pt";

  if (!fullName) return { error: "Insere o teu nome." };
  if (password.length < 6) return { error: "A password deve ter pelo menos 6 caracteres." };

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: "client" },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/client/dashboard`,
    },
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("already been registered")) {
      return { error: "Este email já tem uma conta. Usa a opção 'Esqueceste a password?' se precisares de recuperar o acesso." };
    }
    return { error: "Erro ao criar conta. Tenta novamente." };
  }

  // Auto-assign coach if signup came via invite link (?coach=COACH_ID)
  // If no coachId in URL, fall back to the first coach in the platform
  if (data.user?.id) {
    try {
      const admin = createAdminClient();

      // Save detected language immediately so webhooks/emails use the right lang
      // before the client ever opens the app (which is where LangProvider normally saves it)
      await admin.from("profiles").update({ lang }).eq("id", data.user.id);

      // Resolve coachId — use param if valid, otherwise find first coach
      let resolvedCoachId = coachId;
      if (resolvedCoachId) {
        const { data: check } = await admin
          .from("profiles").select("id").eq("id", resolvedCoachId).eq("role", "coach").maybeSingle();
        if (!check) resolvedCoachId = null;
      }
      if (!resolvedCoachId) {
        const { data: firstCoach } = await admin
          .from("profiles").select("id").eq("role", "coach").limit(1).maybeSingle();
        resolvedCoachId = firstCoach?.id ?? null;
      }

      const coachProfile = resolvedCoachId ? { id: resolvedCoachId } : null;

      if (coachProfile) {
        const coachId = coachProfile.id; // shadow outer coachId with resolved one
        // 1. Assign coach
        await admin.from("coach_clients").insert({
          coach_id: coachId,
          client_id: data.user.id,
          assigned_role: "coach",
        });

        // 2. Set active with 7-day trial — client gets immediate access
        const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await admin
          .from("profiles")
          .update({ status: "active", trial_ends_at: trialEndsAt })
          .eq("id", data.user.id);

        // 3. Send welcome message from coach
        const [{ data: coachProf }] = await Promise.all([
          admin.from("profiles").select("full_name").eq("id", coachId).single(),
        ]);
        const clientFirstName = fullName.split(" ")[0] || "atleta";
        const coachFirstName  = (coachProf?.full_name ?? "").split(" ")[0] || "Coach";
        await admin.from("messages").insert({
          sender_id:   coachId,
          receiver_id: data.user.id,
          content: `Olá ${clientFirstName}! 👋 Sou o ${coachFirstName}. Bem-vindo ao teu trial de 7 dias! Tens acesso completo à app durante esta semana. Explora os treinos, regista os teus check-ins e fala comigo por aqui se tiveres alguma dúvida. Vamos a isso! 💪`,
        });

        // 4. Record referral if signup came via referral link
        if (refCode) {
          const { data: refCodeRow } = await admin
            .from("referral_codes")
            .select("client_id")
            .eq("code", refCode)
            .maybeSingle();
          if (refCodeRow) {
            await admin.from("referrals").insert({
              referrer_id:      refCodeRow.client_id,
              referred_email:   email,
              referred_user_id: data.user.id,
              status:           "signed_up",
            });
          }
        }

        // 5. Notify coach of new signup
        const { sendPushToUser } = await import("@/lib/push");
        sendPushToUser(
          coachId,
          "🆕 Novo cliente em trial!",
          `${fullName} acabou de criar conta. Trial de 7 dias ativo.`,
          "/coach/manage-clients",
        ).then((r) => {
          if (!r.ok) console.warn("[signup] Push to coach failed:", r.error);
        }).catch((e) => console.warn("[signup] Push to coach threw:", e));

        // 6. Send welcome email to new client
        const { sendWelcomeEmail } = await import("@/lib/email");
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        sendWelcomeEmail({
          to:         email,
          clientName: fullName,
          coachName:  coachProf?.full_name ?? "Coach",
          siteUrl,
        }).catch((e) => console.warn("[signup] Welcome email failed:", e));
      }
    } catch {
      // Non-critical — user is created, assignment just didn't happen
      console.warn("[signup] Failed to auto-assign coach:", coachId);
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string).trim();

  if (!email) return { error: "Insere o teu email." };

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
  });

  // Always return success to avoid email enumeration
  if (error) console.error("[forgotPassword]", error.message);

  return { success: true };
}

export async function resetPassword(newPassword: string) {
  const supabase = await createClient();

  if (newPassword.length < 6) {
    return { error: "A password deve ter pelo menos 6 caracteres." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    if (error.message.includes("same password")) {
      return { error: "A nova password não pode ser igual à anterior." };
    }
    return { error: "Erro ao atualizar a password. O link pode ter expirado." };
  }

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
