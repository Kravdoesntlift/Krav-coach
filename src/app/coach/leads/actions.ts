"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateLeadStatus(id: string, status: "new" | "contacted" | "converted") {
  const supabase = await createClient();
  await supabase
    .from("leads")
    .update({
      status,
      contacted_at: status === "contacted" || status === "converted" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  revalidatePath("/coach/leads");
}

export async function updateLeadNotes(id: string, notes: string) {
  const supabase = await createClient();
  await supabase.from("leads").update({ notes }).eq("id", id);
  revalidatePath("/coach/leads");
}

export async function deleteLead(id: string) {
  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/coach/leads");
}
