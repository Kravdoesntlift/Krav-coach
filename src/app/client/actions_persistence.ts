"use server";
import { createClient } from "@/lib/supabase/server";

export async function markWelcomed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ welcomed_at: new Date().toISOString() }).eq("id", user.id);
}

export async function markAchievementsSeen(ids: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // Merge with existing seen_achievements
  const { data: profile } = await supabase.from("profiles").select("seen_achievements").eq("id", user.id).single();
  const existing: string[] = profile?.seen_achievements ?? [];
  const merged = [...new Set([...existing, ...ids])];
  await supabase.from("profiles").update({ seen_achievements: merged }).eq("id", user.id);
}
