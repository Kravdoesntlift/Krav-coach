"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  // Clone days + exercises
  for (const day of plan.workout_days ?? []) {
    const { data: newDay } = await supabase
      .from("workout_days")
      .insert({
        plan_id: newPlan.id,
        day_of_week: day.day_of_week,
        label: day.label,
        order_index: day.order_index,
      })
      .select()
      .single();

    if (newDay && day.exercises?.length > 0) {
      await supabase.from("exercises").insert(
        day.exercises.map((ex: { name: string; sets: number; reps: string; notes: string | null; order_index: number }) => ({
          day_id: newDay.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          notes: ex.notes,
          order_index: ex.order_index,
        }))
      );
    }
  }

  revalidatePath(`/coach/clients/${plan.client_id}`);
  redirect(`/coach/clients/${plan.client_id}`);
}
