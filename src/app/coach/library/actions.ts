"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getCoach() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  return { supabase, user };
}

export async function addExercise(data: {
  name: string;
  muscle_groups: string[];
  description?: string | null;
  video_url?: string | null;
}): Promise<{ error?: string; id?: string }> {
  const { supabase, user } = await getCoach();
  if (!user) return { error: "Não autenticado." };

  const { data: row, error } = await supabase
    .from("exercise_library")
    .insert({
      coach_id: user.id,
      name: data.name,
      muscle_groups: data.muscle_groups,
      description: data.description ?? null,
      video_url: data.video_url ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/coach/library");
  return { id: row.id };
}

export async function deleteExercise(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await getCoach();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("exercise_library")
    .delete()
    .eq("id", id)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/coach/library");
  return {};
}
