"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * The one place that records "I trained".
 *
 * This used to live in the browser, in two copies, and every error was thrown
 * away. Three consequences, all of which happened in production: the screen
 * said the workout was saved while the database never heard about it, the
 * local copy of the session was deleted immediately afterwards (destroying the
 * one safety net at the exact moment it was needed), and a refresh showed an
 * empty week. Between 1 and 18 September not a single set reached the database.
 *
 * Everything here reports what happened. Callers keep their local copy until
 * this says ok.
 */

export interface ExerciseLog {
  exercise_name: string;
  sets: unknown[];
}

export type WriteResult = { ok: true } | { ok: false; error: string; offline?: boolean };

const CLIENT_PAGES = [
  "/client/dashboard",
  "/client/history",
  "/client/progress",
  "/client/achievements",
];

function refreshClientPages() {
  for (const path of CLIENT_PAGES) revalidatePath(path);
}

function serverToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** The device's own date, since a workout belongs to the day the person trained. */
function safeDate(value: string | undefined): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : serverToday();
}

/**
 * Plain language for the person holding the phone, with the code kept on the
 * end so a report ("deu erro 42501") is still diagnosable.
 */
function describe(error: { code?: string; message: string }): string {
  const code = error.code ?? "";
  if (code === "42501" || code === "PGRST301") {
    return "A sessão expirou. Entra outra vez e o treino é guardado.";
  }
  if (code === "23505") return "Este treino já estava guardado.";
  if (code === "42P10" || code.startsWith("42")) {
    return `Erro a guardar no servidor (${code}). O treino ficou guardado no telemóvel.`;
  }
  return `${error.message}${code ? ` (${code})` : ""}`;
}

async function completeDay(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  dayId: string,
  feeling: string | null,
  note: string | null,
): Promise<WriteResult> {
  const { error } = await supabase
    .from("workout_completions")
    .upsert(
      { client_id: clientId, day_id: dayId, feeling, note: note?.trim() || null },
      { onConflict: "client_id,day_id" },
    );
  // Marking the same day twice is the intended outcome, not a failure.
  if (error && error.code !== "23505") return { ok: false, error: describe(error) };
  return { ok: true };
}

/**
 * Save a finished session: the sets, then the day itself.
 *
 * The sets go in first on purpose. If they fail, the day is not marked, so the
 * app never shows a tick over data it did not keep.
 */
export async function finishWorkout(input: {
  dayId: string;
  loggedAt?: string;
  feeling?: string | null;
  note?: string | null;
  logs: ExerciseLog[];
}): Promise<WriteResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "A sessão expirou. Entra outra vez para guardar o treino." };

  const loggedAt = safeDate(input.loggedAt);

  // The unique index this database actually has is
  // (client_id, exercise_name, logged_at). The old code wrote against
  // (client_id, exercise_name, day_id, logged_at), which does not exist, so
  // every single write failed with 42P10 and was discarded in silence.
  //
  // A plan can list the same exercise twice. Two rows with one name in one
  // statement make Postgres reject the whole batch ("cannot affect row a
  // second time"), so repeats are merged before writing.
  const merged = new Map<string, unknown[]>();
  for (const log of input.logs ?? []) {
    const name = log?.exercise_name?.trim();
    if (!name) continue;
    const sets = Array.isArray(log.sets) ? log.sets : [];
    merged.set(name, [...(merged.get(name) ?? []), ...sets]);
  }

  if (merged.size > 0) {
    const rows = [...merged].map(([exercise_name, sets]) => ({
      client_id: user.id,
      exercise_name,
      day_id: input.dayId,
      logged_at: loggedAt,
      sets,
    }));
    const { error } = await supabase
      .from("workout_logs")
      .upsert(rows, { onConflict: "client_id,exercise_name,logged_at" });
    if (error) return { ok: false, error: describe(error) };
  }

  const done = await completeDay(supabase, user.id, input.dayId, input.feeling ?? null, input.note ?? null);
  if (!done.ok) return done;

  refreshClientPages();
  return { ok: true };
}

/** Tick a day without a live session, from the day card. */
export async function markDayComplete(input: {
  dayId: string;
  feeling?: string | null;
  note?: string | null;
}): Promise<WriteResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "A sessão expirou. Entra outra vez para guardar o treino." };

  const done = await completeDay(supabase, user.id, input.dayId, input.feeling ?? null, input.note ?? null);
  if (!done.ok) return done;

  refreshClientPages();
  return { ok: true };
}

/** Untick a day. The sets stay: they were still lifted. */
export async function undoDayComplete(dayId: string): Promise<WriteResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "A sessão expirou. Entra outra vez." };

  const { error } = await supabase
    .from("workout_completions")
    .delete()
    .eq("client_id", user.id)
    .eq("day_id", dayId);
  if (error) return { ok: false, error: describe(error) };

  refreshClientPages();
  return { ok: true };
}
