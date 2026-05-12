"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type TriggerType =
  | "no_workout_days"
  | "no_checkin_days"
  | "perfect_week"
  | "checkin_monday";

interface AutomationData {
  name: string;
  trigger_type: TriggerType;
  trigger_value?: number;
  message_template: string;
  is_active?: boolean;
}

async function getCoachUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado.", supabase, user: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "coach") {
    return { error: "Acesso negado.", supabase, user: null };
  }

  return { error: null, supabase, user };
}

export async function createAutomation(data: AutomationData) {
  const { error, supabase, user } = await getCoachUser();
  if (error || !user) return { error };

  const { error: insertErr } = await supabase.from("coach_automations").insert({
    coach_id: user.id,
    name: data.name,
    trigger_type: data.trigger_type,
    trigger_value: data.trigger_value ?? null,
    message_template: data.message_template,
    is_active: data.is_active ?? true,
  });

  if (insertErr) return { error: insertErr.message };

  revalidatePath("/coach/automations");
  return { success: true };
}

export async function updateAutomation(id: string, data: Partial<AutomationData>) {
  const { error, supabase, user } = await getCoachUser();
  if (error || !user) return { error };

  const { error: updateErr } = await supabase
    .from("coach_automations")
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.trigger_type !== undefined && { trigger_type: data.trigger_type }),
      ...(data.trigger_value !== undefined && { trigger_value: data.trigger_value }),
      ...(data.message_template !== undefined && { message_template: data.message_template }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
    })
    .eq("id", id)
    .eq("coach_id", user.id);

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/coach/automations");
  return { success: true };
}

export async function deleteAutomation(id: string) {
  const { error, supabase, user } = await getCoachUser();
  if (error || !user) return { error };

  const { error: deleteErr } = await supabase
    .from("coach_automations")
    .delete()
    .eq("id", id)
    .eq("coach_id", user.id);

  if (deleteErr) return { error: deleteErr.message };

  revalidatePath("/coach/automations");
  return { success: true };
}

export async function toggleAutomation(id: string, isActive: boolean) {
  const { error, supabase, user } = await getCoachUser();
  if (error || !user) return { error };

  const { error: updateErr } = await supabase
    .from("coach_automations")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("coach_id", user.id);

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/coach/automations");
  return { success: true };
}
