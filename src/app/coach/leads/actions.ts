"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireCoach() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return { supabase, user: null };
  return { supabase, user };
}

export async function updateLeadStatus(id: string, status: "new" | "contacted" | "converted"): Promise<void> {
  const { supabase, user } = await requireCoach();
  if (!user) return;
  await supabase
    .from("leads")
    .update({
      status,
      contacted_at: status === "contacted" || status === "converted" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("coach_id", user.id);
  revalidatePath("/coach/leads");
}

export async function updateLeadNotes(id: string, notes: string): Promise<void> {
  const { supabase, user } = await requireCoach();
  if (!user) return;
  await supabase.from("leads").update({ notes }).eq("id", id).eq("coach_id", user.id);
  revalidatePath("/coach/leads");
}

export async function deleteLead(id: string): Promise<void> {
  const { supabase, user } = await requireCoach();
  if (!user) return;
  await supabase.from("leads").delete().eq("id", id).eq("coach_id", user.id);
  revalidatePath("/coach/leads");
}
