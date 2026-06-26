"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getCoach() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return { supabase, user: null };
  return { supabase, user };
}

export async function createSession(data: {
  client_id: string | null;
  scheduled_at: string;
  duration_min: number;
  session_type: "online" | "presencial";
  location_or_link: string | null;
  notes: string | null;
}): Promise<{ error?: string; id?: string }> {
  const { supabase, user } = await getCoach();
  if (!user) return { error: "Não autenticado." };

  const { data: row, error } = await supabase
    .from("coaching_sessions")
    .insert({
      coach_id: user.id,
      client_id: data.client_id ?? null,
      scheduled_at: data.scheduled_at,
      duration_min: data.duration_min,
      session_type: data.session_type,
      location_or_link: data.location_or_link ?? null,
      notes: data.notes ?? null,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/coach/sessions");
  return { id: row.id };
}

export async function updateSessionStatus(
  id: string,
  status: "confirmed" | "cancelled" | "completed"
): Promise<{ error?: string }> {
  const { supabase, user } = await getCoach();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("coaching_sessions")
    .update({ status })
    .eq("id", id)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/coach/sessions");
  return {};
}

export async function deleteSession(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await getCoach();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("coaching_sessions")
    .delete()
    .eq("id", id)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/coach/sessions");
  return {};
}
