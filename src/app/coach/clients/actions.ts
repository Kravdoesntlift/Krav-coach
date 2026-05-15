"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendPushToUser } from "@/lib/push";

export async function updateClientSubscription(
  clientId: string,
  status: string,
  renewsAt: string | null
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // Verify coach has access via plan OR explicit assignment
  const [{ data: plan }, { data: assignment }] = await Promise.all([
    supabase.from("workout_plans").select("id")
      .eq("coach_id", user.id).eq("client_id", clientId).limit(1).maybeSingle(),
    supabase.from("coach_clients").select("id")
      .eq("coach_id", user.id).eq("client_id", clientId).limit(1).maybeSingle(),
  ]);

  if (!plan && !assignment) return { error: "Sem acesso a este cliente." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status, subscription_renews_at: renewsAt || null })
    .eq("id", clientId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function createChallenge(data: {
  clientId: string | null;
  title: string;
  description: string;
  targetType: string;
  targetCount: number;
  weekStart: string;
  coachId: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== data.coachId) return { error: "Sem permissão." };

  const { error } = await supabase.from("challenges").insert({
    coach_id: user.id,
    client_id: data.clientId || null,
    title: data.title,
    description: data.description || null,
    target_type: data.targetType,
    target_count: data.targetCount,
    week_start: data.weekStart,
  });

  if (error) return { error: error.message };

  // Notify client
  if (data.clientId) {
    sendPushToUser(
      data.clientId,
      "🏆 Novo desafio semanal!",
      `O teu coach criou um novo desafio: ${data.title}`,
      "/client/dashboard",
    ).catch(() => {});
  }

  revalidatePath(`/coach/clients/${data.clientId}`);
  return {};
}

export async function deleteChallenge(challengeId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("challenges")
    .delete()
    .eq("id", challengeId)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function broadcastMessage(
  message: string,
  targetStatus: "all" | "active",
): Promise<{ error?: string; count?: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: plans } = await supabase
    .from("workout_plans")
    .select("client_id")
    .eq("coach_id", user.id);

  if (!plans?.length) return { count: 0 };

  const clientIds = [...new Set(plans.map((p) => p.client_id))];

  const { data: clients } = await supabase
    .from("profiles")
    .select("id, status")
    .in("id", clientIds);

  if (!clients?.length) return { count: 0 };

  const targets = targetStatus === "active"
    ? clients.filter((c) => !c.status || c.status === "active")
    : clients;

  if (!targets.length) return { count: 0 };

  const msgs = targets.map((c) => ({
    sender_id: user.id,
    receiver_id: c.id,
    content: message,
  }));

  const { error } = await supabase.from("messages").insert(msgs);
  if (error) return { error: error.message };
  return { count: targets.length };
}

// ─── GOALS ────────────────────────────────────────────────────────────────────

export async function createGoal({
  clientId, title, description, target_value, unit, deadline,
}: {
  clientId: string; title: string; description: string | null;
  target_value: number | null; unit: string | null; deadline: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: goal, error } = await supabase
    .from("client_goals")
    .insert({ coach_id: user.id, client_id: clientId, title, description, target_value, unit, deadline })
    .select()
    .single();

  if (error) return { error: error.message };

  // Notify client
  sendPushToUser(
    clientId,
    "🎯 Novo objetivo definido!",
    `O teu coach definiu um novo objetivo: ${title}`,
    "/client/dashboard",
  ).catch(() => {});

  revalidatePath(`/coach/clients/${clientId}`);
  return { goal };
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("client_goals").delete().eq("id", goalId).eq("coach_id", user.id);
}

export async function updateGoalProgress(goalId: string, currentValue: number, completed: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("client_goals").update({ current_value: currentValue, completed }).eq("id", goalId).eq("coach_id", user.id);
}

// ─── PLAN TEMPLATES ──────────────────────────────────────────────────────────

export async function saveAsTemplate(planId: string, templateName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: plan } = await supabase
    .from("workout_plans")
    .select("*, workout_days(*, exercises(*))")
    .eq("id", planId)
    .eq("coach_id", user.id)
    .single();

  if (!plan) return { error: "Plano não encontrado." };

  const { data: tmpl, error: tmplErr } = await supabase
    .from("plan_templates")
    .insert({ coach_id: user.id, name: templateName })
    .select()
    .single();

  if (tmplErr || !tmpl) return { error: tmplErr?.message };

  for (const day of plan.workout_days ?? []) {
    const { data: tDay } = await supabase
      .from("plan_template_days")
      .insert({
        template_id: tmpl.id,
        day_of_week: day.day_of_week,
        label: day.label,
        is_rest: day.is_rest,
        order_index: day.order_index,
      })
      .select()
      .single();

    if (tDay) {
      const exercises = (day as Record<string, unknown>).exercises as { name: string; sets: number; reps: number; notes: string | null; video_url: string | null; order_index: number }[] ?? [];
      if (exercises.length > 0) {
        await supabase.from("plan_template_exercises").insert(
          exercises.map((ex) => ({
            template_day_id: tDay.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            notes: ex.notes,
            video_url: ex.video_url,
            order_index: ex.order_index,
          }))
        );
      }
    }
  }

  return { templateId: tmpl.id };
}

export async function getTemplates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("plan_templates")
    .select("id, name, created_at")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("plan_templates").delete().eq("id", templateId).eq("coach_id", user.id);
}

export async function applyTemplate(templateId: string, clientId: string, weekStart: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: tmpl } = await supabase
    .from("plan_templates")
    .select("*, plan_template_days(*, plan_template_exercises(*))")
    .eq("id", templateId)
    .eq("coach_id", user.id)
    .single();

  if (!tmpl) return { error: "Template não encontrado." };

  const { data: plan, error: planErr } = await supabase
    .from("workout_plans")
    .insert({ coach_id: user.id, client_id: clientId, name: tmpl.name, week_start: weekStart })
    .select()
    .single();

  if (planErr || !plan) return { error: planErr?.message };

  for (const tDay of tmpl.plan_template_days ?? []) {
    const { data: day } = await supabase
      .from("workout_days")
      .insert({
        plan_id: plan.id,
        day_of_week: tDay.day_of_week,
        label: tDay.label,
        is_rest: tDay.is_rest,
        order_index: tDay.order_index,
      })
      .select()
      .single();

    if (day && tDay.plan_template_exercises?.length > 0) {
      await supabase.from("exercises").insert(
        tDay.plan_template_exercises.map((ex: { name: string; sets: number; reps: number; notes: string | null; video_url: string | null; order_index: number }) => ({
          day_id: day.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          notes: ex.notes,
          video_url: ex.video_url,
          order_index: ex.order_index,
        }))
      );
    }
  }

  revalidatePath(`/coach/clients/${clientId}`);
  return { planId: plan.id };
}
