"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function assignClient(clientId: string, role: string = "coach") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // Verify current user is a coach
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return { error: "Sem permissão — conta não é coach." };

  // Use admin client so RLS never blocks a valid coach inserting their own record
  const admin = createAdminClient();
  const { error } = await admin
    .from("coach_clients")
    .insert({ coach_id: user.id, client_id: clientId, assigned_role: role });

  if (error) {
    if (error.code === "23505") return { error: "Cliente já está atribuído com este papel." };
    if (error.message?.includes("does not exist")) {
      return { error: "Tabela coach_clients não existe — executa a migração SQL no Supabase." };
    }
    console.error("[assignClient] error:", error);
    return { error: error.message };
  }

  // Send automatic welcome message in chat (only when assigning as coach)
  if (role === "coach") {
    try {
      const [{ data: coachProfile }, { data: clientProfile }] = await Promise.all([
        admin.from("profiles").select("full_name").eq("id", user.id).single(),
        admin.from("profiles").select("full_name").eq("id", clientId).single(),
      ]);

      const clientFirstName = (clientProfile?.full_name ?? "").split(" ")[0] || "atleta";
      const coachFirstName  = (coachProfile?.full_name  ?? "").split(" ")[0] || "Coach";

      await admin.from("messages").insert({
        sender_id:   user.id,
        receiver_id: clientId,
        content: `Olá ${clientFirstName}! 👋 Sou o ${coachFirstName}, o teu coach na KRAV. Bem-vindo ao teu programa personalizado! Estou aqui para te ajudar a atingir os teus objetivos. Qualquer dúvida ou feedback, fala comigo por aqui. Vamos a isso! 💪`,
      });
    } catch (msgErr) {
      // Non-critical — assignment succeeded, but log the error clearly
      console.error("[assignClient] welcome message failed:", msgErr);
    }
  }

  revalidatePath("/coach/manage-clients");
  revalidatePath("/coach/dashboard");
  revalidatePath("/coach/messages");
  return { success: true };
}

export async function activateClient(clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "coach") return { error: "Sem permissão." };

  const { data: rel } = await supabase.from("coach_clients")
    .select("id").eq("coach_id", user.id).eq("client_id", clientId).maybeSingle();
  if (!rel) return { error: "Sem acesso a este cliente." };

  const admin = createAdminClient();

  // Set client status to active
  const { error } = await admin
    .from("profiles")
    .update({ status: "active" })
    .eq("id", clientId);

  if (error) return { error: error.message };

  // Notify client
  try {
    const { sendPushToUser } = await import("@/lib/push");
    const coachFirstName = (profile?.full_name ?? "").split(" ")[0] || "Coach";
    sendPushToUser(
      clientId,
      "✅ Conta ativada!",
      `O ${coachFirstName} ativou o teu acesso. Bem-vindo à KRAV! 💪`,
      "/client/dashboard",
    ).catch(() => {});

    // Send activation message in chat
    await admin.from("messages").insert({
      sender_id: user.id,
      receiver_id: clientId,
      content: `✅ A tua conta está agora ativa! Já tens acesso total à app. Vamos começar a trabalhar juntos! 💪`,
    });
  } catch { /* non-critical */ }

  revalidatePath("/coach/manage-clients");
  revalidatePath("/coach/dashboard");
  return { success: true };
}

export async function unarchiveClient(clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return { error: "Sem permissão." };

  const { data: rel } = await supabase.from("coach_clients")
    .select("id").eq("coach_id", user.id).eq("client_id", clientId).maybeSingle();
  if (!rel) return { error: "Sem acesso a este cliente." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status: "active" })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/coach/manage-clients");
  revalidatePath("/coach/dashboard");
  return { success: true };
}

export async function archiveClient(clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return { error: "Sem permissão." };

  const { data: rel } = await supabase.from("coach_clients")
    .select("id").eq("coach_id", user.id).eq("client_id", clientId).maybeSingle();
  if (!rel) return { error: "Sem acesso a este cliente." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status: "archived" })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/coach/manage-clients");
  revalidatePath("/coach/dashboard");
  return { success: true };
}

export async function deleteClient(clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return { error: "Sem permissão." };

  const { data: rel } = await supabase.from("coach_clients")
    .select("id").eq("coach_id", user.id).eq("client_id", clientId).maybeSingle();
  if (!rel) return { error: "Sem acesso a este cliente." };

  const admin = createAdminClient();

  // Delete auth user — cascades to profile and all related data
  const { error } = await admin.auth.admin.deleteUser(clientId);
  if (error) return { error: error.message };

  revalidatePath("/coach/manage-clients");
  revalidatePath("/coach/dashboard");
  return { success: true };
}

export async function unassignClient(clientId: string, role: string = "coach") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("coach_clients")
    .delete()
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .eq("assigned_role", role);

  if (error) {
    console.error("[unassignClient] error:", error);
    return { error: error.message };
  }

  revalidatePath("/coach/manage-clients");
  revalidatePath("/coach/dashboard");
  return { success: true };
}
