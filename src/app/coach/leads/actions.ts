"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Leads belong to the business, not to a particular coach: the table has no
 * coach_id column and never had one. Every action here filtered on
 * `.eq("coach_id", user.id)` anyway, so Postgres answered
 * "column leads.coach_id does not exist" (42703) and the actions, which
 * returned void and never looked at the result, reported nothing. Pressing
 * "Contactado", saving a note and deleting a lead all did nothing at all,
 * quietly, since the day the buttons were added.
 *
 * Who may touch a lead is decided by row level security: the "Coaches can
 * update/delete leads" policies. requireCoach keeps the same answer from the
 * app side, so a non-coach gets a message rather than a silent no-op.
 */

export type LeadResult = { ok: true } | { ok: false; error: string };

type LeadStatus = "new" | "contacted" | "converted";

async function requireCoach() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return { supabase, user: null };
  return { supabase, user };
}

const NOT_A_COACH = "A sessão expirou ou não tens permissão. Entra outra vez.";

/** A lead that no longer exists, or a policy that refuses, changes no rows. */
const NOT_FOUND = "Esse lead já não existe, ou não tens permissão para o alterar.";

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<LeadResult> {
  const { supabase, user } = await requireCoach();
  if (!user) return { ok: false, error: NOT_A_COACH };

  const { data, error } = await supabase
    .from("leads")
    .update({
      status,
      contacted_at: status === "contacted" || status === "converted" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    // Asking for the row back is what turns "changed nothing" into something
    // the screen can say out loud.
    .select("id");

  if (error) return { ok: false, error: `${error.message}${error.code ? ` (${error.code})` : ""}` };
  if (!data?.length) return { ok: false, error: NOT_FOUND };

  revalidatePath("/coach/leads");
  return { ok: true };
}

export async function updateLeadNotes(id: string, notes: string): Promise<LeadResult> {
  const { supabase, user } = await requireCoach();
  if (!user) return { ok: false, error: NOT_A_COACH };

  const { data, error } = await supabase
    .from("leads")
    .update({ notes })
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, error: `${error.message}${error.code ? ` (${error.code})` : ""}` };
  if (!data?.length) return { ok: false, error: NOT_FOUND };

  revalidatePath("/coach/leads");
  return { ok: true };
}

export async function deleteLead(id: string): Promise<LeadResult> {
  const { supabase, user } = await requireCoach();
  if (!user) return { ok: false, error: NOT_A_COACH };

  const { data, error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, error: `${error.message}${error.code ? ` (${error.code})` : ""}` };
  if (!data?.length) return { ok: false, error: NOT_FOUND };

  revalidatePath("/coach/leads");
  return { ok: true };
}
