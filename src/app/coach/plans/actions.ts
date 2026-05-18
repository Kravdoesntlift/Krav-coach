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

  // New week = week_start + 7 days
  const newWeekStart = new Date(plan.week_start);
  newWeekStart.setDate(newWeekStart.getDate() + 7);
  const newWeekStr = newWeekStart.toISOString().split("T")[0];

  // Create new plan
  const { data: newPlan, error: planErr } = await supabase
    .from("workout_plans")
    .insert({
      coach_id: plan.coach_id,
      client_id: plan.client_id,
      name: plan.name,
      week_start: newWeekStr,
    })
    .select()
    .single();

  if (planErr || !newPlan) return { error: "Erro ao duplicar plano." };

  // Clone days + exercises — batch inserts
  const sourceDays = plan.workout_days ?? [];

  if (sourceDays.length > 0) {
    const { data: insertedDays } = await supabase
      .from("workout_days")
      .insert(
        sourceDays.map((day: { day_of_week: number; label: string | null; order_index: number }) => ({
          plan_id: newPlan.id,
          day_of_week: day.day_of_week,
          label: day.label,
          order_index: day.order_index,
        }))
      )
      .select("id, day_of_week, order_index");

    if (insertedDays && insertedDays.length > 0) {
      type InsertedDay = { id: string; day_of_week: number; order_index: number };
      const allExercises: {
        day_id: string; name: string; sets: number; reps: string;
        notes: string | null; order_index: number;
      }[] = [];

      for (const day of sourceDays) {
        const matched = (insertedDays as InsertedDay[]).find(
          (d) => d.day_of_week === day.day_of_week && d.order_index === day.order_index
        );
        if (!matched) continue;
        for (const ex of day.exercises ?? []) {
          allExercises.push({
            day_id: matched.id,
            name: ex.name, sets: ex.sets, reps: ex.reps,
            notes: ex.notes, order_index: ex.order_index,
          });
        }
      }

      if (allExercises.length > 0) {
        await supabase.from("exercises").insert(allExercises);
      }
    }
  }

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
) {
  const newDate = new Date(plan.week_start);
  newDate.setDate(newDate.getDate() + weeksOffset * 7);
  const newWeekStr = newDate.toISOString().split("T")[0];

  const { data: newPlan, error } = await supabase
    .from("workout_plans")
    .insert({ coach_id: plan.coach_id, client_id: plan.client_id, name: plan.name, week_start: newWeekStr })
    .select()
    .single();
  if (error || !newPlan) return;

  const sourceDays = plan.workout_days ?? [];
  if (sourceDays.length === 0) return;

  const { data: insertedDays } = await supabase
    .from("workout_days")
    .insert(sourceDays.map((d) => ({
      plan_id: newPlan.id,
      day_of_week: d.day_of_week,
      label: d.label,
      order_index: d.order_index,
      is_rest: d.is_rest ?? false,
    })))
    .select("id, day_of_week, order_index");

  if (!insertedDays?.length) return;

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
  if (exRows.length > 0) await supabase.from("exercises").insert(exRows);
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
  for (let w = 1; w < totalWeeks; w++) {
    await clonePlanWeeks(supabase, plan, w);
  }

  revalidatePath(`/coach/clients/${plan.client_id}`);
  return { success: true, weeks: totalWeeks };
}
