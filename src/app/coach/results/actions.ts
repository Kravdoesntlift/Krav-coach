"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addTransformation(data: {
  display_name: string;
  before_url: string;
  after_url: string;
  duration_weeks?: number | null;
  highlight?: string | null;
  is_public: boolean;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "coach") return { error: "Sem permissão." };

  const { error } = await supabase.from("client_transformations").insert({
    coach_id: user.id,
    display_name: data.display_name,
    before_url: data.before_url,
    after_url: data.after_url,
    duration_weeks: data.duration_weeks ?? null,
    highlight: data.highlight ?? null,
    is_public: data.is_public,
  });

  if (error) return { error: error.message };
  revalidatePath("/coach/results");
  return {};
}

export async function deleteTransformation(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("client_transformations")
    .delete()
    .eq("id", id)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/coach/results");
  return {};
}

export async function togglePublic(id: string, is_public: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("client_transformations")
    .update({ is_public })
    .eq("id", id)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/coach/results");
  return {};
}
