"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Ticking an alert off the dashboard.
 *
 * The alerts are computed, never stored, so "done" cannot mean "delete". It
 * means "handled for this context": this week, or this renewal. When the week
 * turns, or the renewal date moves, the same alert comes back on its own.
 * That is the difference between a list that stays useful with twenty clients
 * and one that either grows forever or quietly forgets people.
 */

export type AckResult = { ok: true } | { ok: false; error: string };

// Postgres says 42P01 for a missing relation; PostgREST answers PGRST205 from
// its own schema cache before the query ever reaches the database.
const MISSING_TABLE = ["42P01", "PGRST205"];

const SETUP_HINT =
  "Falta correr supabase/migration_alert_acks.sql no SQL Editor do Supabase. Depois disso isto funciona.";

async function requireCoach() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return { supabase, user: null };
  return { supabase, user };
}

export async function acknowledgeAlert(input: {
  clientId: string;
  alertType: string;
  context: string;
}): Promise<AckResult> {
  const { supabase, user } = await requireCoach();
  if (!user) return { ok: false, error: "A sessão expirou ou não tens permissão." };

  const { error } = await supabase.from("coach_alert_acks").upsert(
    {
      coach_id: user.id,
      client_id: input.clientId,
      alert_type: input.alertType,
      context: input.context,
    },
    { onConflict: "coach_id,client_id,alert_type,context" },
  );

  if (error) {
    // The table is created by a migration only André can run. Say so instead
    // of failing with a Postgres code nobody can act on.
    if (MISSING_TABLE.includes(error.code ?? "")) return { ok: false, error: SETUP_HINT };
    return { ok: false, error: `${error.message}${error.code ? ` (${error.code})` : ""}` };
  }

  revalidatePath("/coach/dashboard");
  return { ok: true };
}

/** Put an alert back on the list. */
export async function undoAcknowledgeAlert(input: {
  clientId: string;
  alertType: string;
  context: string;
}): Promise<AckResult> {
  const { supabase, user } = await requireCoach();
  if (!user) return { ok: false, error: "A sessão expirou ou não tens permissão." };

  const { error } = await supabase
    .from("coach_alert_acks")
    .delete()
    .eq("coach_id", user.id)
    .eq("client_id", input.clientId)
    .eq("alert_type", input.alertType)
    .eq("context", input.context);

  if (error) {
    if (MISSING_TABLE.includes(error.code ?? "")) return { ok: false, error: SETUP_HINT };
    return { ok: false, error: `${error.message}${error.code ? ` (${error.code})` : ""}` };
  }

  revalidatePath("/coach/dashboard");
  return { ok: true };
}
