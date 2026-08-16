"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function deletePlan(planId: string, clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verify ownership
  const { data: plan } = await supabase
    .from("workout_plans")
    .select("coach_id, client_id")
    .eq("id", planId)
    .single();

  if (!plan || plan.coach_id !== user!.id) {
    return { error: "Sem permissão." };
  }

  await supabase.from("workout_plans").delete().eq("id", planId);
  revalidatePath(`/coach/clients/${clientId}`);
  return { success: true };
}

export async function duplicatePlan(planId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch full plan
  const { data: plan } = await supabase
    .from("workout_plans")
    .select(`*, workout_days(*, exercises(*))`)
    .eq("id", planId)
    .eq("coach_id", user!.id)
    .single();

  if (!plan) return { error: "Plano não encontrado." };

  // Share one implementation with createProgram. The copy that used to live here
  // had drifted: it dropped is_rest, video_url and superset_group, so duplicating
  // a plan quietly turned rest days into training days and lost exercise videos.
  const result = await clonePlanWeeks(supabase, plan, 1);
  if ("error" in result) return { error: result.error };

  revalidatePath(`/coach/clients/${plan.client_id}`);
  redirect(`/coach/clients/${plan.client_id}`);
}

// ── Clone one plan N weeks forward (shared logic) ────────────────────────────
async function clonePlanWeeks(
  supabase: SupabaseClient,
  plan: {
    id: string; coach_id: string; client_id: string; name: string; week_start: string;
    workout_days: Array<{
      day_of_week: number; label: string | null; order_index: number; is_rest?: boolean;
      exercises: Array<{ name: string; sets: number; reps: string; notes: string | null; order_index: number; video_url?: string | null; superset_group?: string | null }>;
    }>;
  },
  weeksOffset: number
): Promise<{ planId: string } | { error: string }> {
  // All UTC. A "YYYY-MM-DD" string parses as UTC midnight, so mixing in local
  // getters/setters shifts the result by a day whenever the span crosses a DST
  // change — 2026-03-23 + 1 week came out as Sunday the 29th instead of Monday
  // the 30th, and a week_start that isn't a Monday never matches the dashboard.
  const newDate = new Date(plan.week_start + "T00:00:00Z");
  newDate.setUTCDate(newDate.getUTCDate() + weeksOffset * 7);
  const newWeekStr = newDate.toISOString().split("T")[0];

  const { data: newPlan, error } = await supabase
    .from("workout_plans")
    .insert({ coach_id: plan.coach_id, client_id: plan.client_id, name: plan.name, week_start: newWeekStr })
    .select()
    .single();
  if (error || !newPlan) {
    return { error: error?.message ?? "Erro ao criar o plano." };
  }

  const sourceDays = plan.workout_days ?? [];
  if (sourceDays.length === 0) return { planId: newPlan.id as string };

  const { data: insertedDays, error: daysErr } = await supabase
    .from("workout_days")
    .insert(sourceDays.map((d) => ({
      plan_id: newPlan.id,
      day_of_week: d.day_of_week,
      label: d.label,
      order_index: d.order_index,
      is_rest: d.is_rest ?? false,
    })))
    .select("id, day_of_week, order_index");

  // A plan whose days failed to copy is worse than no plan — it looks complete
  // in the list but opens empty. Remove it and report instead.
  if (daysErr || !insertedDays?.length) {
    await supabase.from("workout_plans").delete().eq("id", newPlan.id);
    return { error: daysErr?.message ?? "Erro ao copiar os dias do plano." };
  }

  type IDay = { id: string; day_of_week: number; order_index: number };
  const exRows: object[] = [];
  for (const day of sourceDays) {
    const matched = (insertedDays as IDay[]).find(
      (d) => d.day_of_week === day.day_of_week && d.order_index === day.order_index
    );
    if (!matched) continue;
    for (const ex of day.exercises ?? []) {
      exRows.push({
        day_id: matched.id, name: ex.name, sets: ex.sets, reps: ex.reps,
        notes: ex.notes, order_index: ex.order_index,
        video_url: ex.video_url ?? null, superset_group: ex.superset_group ?? null,
      });
    }
  }
  if (exRows.length > 0) {
    const { error: exErr } = await supabase.from("exercises").insert(exRows);
    if (exErr) {
      await supabase.from("workout_plans").delete().eq("id", newPlan.id);
      return { error: exErr.message };
    }
  }

  return { planId: newPlan.id as string };
}

// ── Create a multi-week program from an existing plan ────────────────────────
export async function createProgram(planId: string, totalWeeks: number) {
  if (totalWeeks < 2 || totalWeeks > 16) return { error: "Número de semanas inválido (2-16)." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: plan } = await supabase
    .from("workout_plans")
    .select(`*, workout_days(*, exercises(*))`)
    .eq("id", planId)
    .eq("coach_id", user!.id)
    .single();

  if (!plan) return { error: "Plano não encontrado." };

  // Clone weeks 2..N (week 1 already exists as the source plan)
  let created = 1;
  for (let w = 1; w < totalWeeks; w++) {
    const result = await clonePlanWeeks(supabase, plan, w);
    if ("error" in result) {
      // Stop at the first failure and say how far it got, rather than reporting
      // a full programme the coach doesn't actually have.
      revalidatePath(`/coach/clients/${plan.client_id}`);
      return {
        error: `Criadas ${created} de ${totalWeeks} semanas. A semana ${w + 1} falhou: ${result.error}`,
      };
    }
    created++;
  }

  revalidatePath(`/coach/clients/${plan.client_id}`);
  return { success: true, weeks: totalWeeks };
}
