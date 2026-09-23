import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildBasePlan, type BasePlanInput, type Equipment, type Goal, type Level } from "./base-plan";

/**
 * Give a new account a plan the moment it exists.
 *
 * Until now a trial started with an empty week and the line "o teu coach ainda
 * não criou o plano". That is the worst possible first screen: the person came
 * from a funnel that promised a method, and the app opens with homework for
 * someone else. It also does not scale, since it means writing a plan by hand
 * for every trial, most of which never pay.
 *
 * The plan written here is explicitly the base programme, named as such. What
 * a subscription buys is the coach reading the answers and writing a plan
 * against them, which is a different thing and has to stay a different thing.
 */

export type ProvisionResult =
  | { ok: true; created: true; planIds: string[] }
  | { ok: true; created: false; reason: string }
  | { ok: false; error: string };

/**
 * The same client and the same week always produce the same plan id.
 *
 * Two renders of the dashboard can land at once (a prefetch, a second tab, or
 * React rendering twice in development) and both will see no plan and both
 * will write one. Measured: four plans where there should have been two.
 * A primary key derived from the inputs turns that race into a duplicate key
 * error, which is the answer we want anyway: somebody else already did it.
 *
 * UUID v5 style: a namespace hash with the version and variant bits set.
 */
export function basePlanIdFor(clientId: string, weekStart: string): string {
  const hash = createHash("sha1").update(`krav-base-plan:${clientId}:${weekStart}`).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Monday of the week containing `date`, as YYYY-MM-DD, in UTC. */
export function mondayOf(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // getUTCDay: 0 = Sunday. Monday-first offset.
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function addWeeks(isoDate: string, weeks: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];
const EQUIPMENT: Equipment[] = ["gym_full", "gym_basic", "home_weights", "home_none", "outdoor"];
const GOALS: Goal[] = ["lose_weight", "gain_muscle", "athletic"];

function asOneOf<T extends string>(value: unknown, allowed: T[]): T | null {
  return typeof value === "string" && (allowed as string[]).includes(value) ? (value as T) : null;
}

/**
 * Writes the base plan for the current week and the next one. A seven day
 * trial almost always straddles a Sunday, and a plan that stops on the
 * Sunday leaves the second half of the trial looking empty.
 */
export async function ensureBasePlan(args: {
  clientId: string;
  /** Optional: looked up here when the caller cannot see it. */
  coachId?: string;
  weeks?: number;
}): Promise<ProvisionResult> {
  const { clientId } = args;
  const weeks = args.weeks ?? 2;
  const admin = createAdminClient();

  // The client's own session cannot read coach_clients (that table's policies
  // are written for coaches), so a caller on the client side has no way to
  // pass this. Resolve it here, with the service role, or the whole thing
  // silently does nothing for exactly the people it exists for.
  let coachId = args.coachId ?? null;
  if (!coachId) {
    const { data: link } = await admin
      .from("coach_clients")
      .select("coach_id")
      .eq("client_id", clientId)
      .eq("assigned_role", "coach")
      .maybeSingle();
    coachId = link?.coach_id ?? null;
  }
  if (!coachId) {
    const { data: coach } = await admin.from("profiles").select("id").eq("role", "coach").limit(1).maybeSingle();
    coachId = coach?.id ?? null;
  }
  if (!coachId) return { ok: false, error: "no coach to attach the plan to" };

  // Never a second time, and never over a plan the coach wrote.
  const { data: existing, error: existingErr } = await admin
    .from("workout_plans")
    .select("id")
    .eq("client_id", clientId)
    .limit(1);
  if (existingErr) return { ok: false, error: `looking for existing plans: ${existingErr.message}` };
  if (existing && existing.length > 0) return { ok: true, created: false, reason: "client already has a plan" };

  const [{ data: onboarding }, { data: profile }] = await Promise.all([
    admin
      .from("client_onboarding")
      .select("fitness_level, level, equipment, goal, available_days, availability, session_duration")
      .eq("client_id", clientId)
      .maybeSingle(),
    admin.from("profiles").select("lang").eq("id", clientId).maybeSingle(),
  ]);

  const input: BasePlanInput = {
    level: asOneOf(onboarding?.level ?? onboarding?.fitness_level, LEVELS),
    equipment: asOneOf(onboarding?.equipment, EQUIPMENT),
    goal: asOneOf(onboarding?.goal, GOALS),
    trainingDays: Array.isArray(onboarding?.available_days) ? (onboarding!.available_days as number[]) : [],
    daysPerWeek: typeof onboarding?.availability === "number" ? onboarding.availability : null,
    sessionMinutes: typeof onboarding?.session_duration === "number" ? onboarding.session_duration : null,
    lang: profile?.lang === "en" ? "en" : "pt",
  };

  const firstMonday = mondayOf();
  const planIds: string[] = [];

  // The week in progress starts today. Every week after it is the full split.
  const thisWeek = buildBasePlan({ ...input, startOnWeekday: new Date().getUTCDay() });
  const laterWeeks = buildBasePlan(input);

  for (let week = 0; week < weeks; week++) {
    const blueprint = week === 0 ? thisWeek : laterWeeks;
    const weekStart = addWeeks(firstMonday, week);
    const planId = basePlanIdFor(clientId, weekStart);

    const { error: planErr } = await admin
      .from("workout_plans")
      .insert({
        id: planId,
        coach_id: coachId,
        client_id: clientId,
        name: blueprint.name,
        week_start: weekStart,
      });

    if (planErr && planErr.code !== "23505") {
      return { ok: false, error: `workout_plans: ${planErr.message}` };
    }

    if (planErr) {
      // Another render got here first. Its days are either already in, or it
      // died between the two writes: only carry on if the week is still empty.
      const { count } = await admin
        .from("workout_days")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", planId);
      if ((count ?? 0) > 0) continue;
    }

    planIds.push(planId);

    const { data: days, error: daysErr } = await admin
      .from("workout_days")
      .insert(
        blueprint.days.map((d) => ({
          plan_id: planId,
          day_of_week: d.day_of_week,
          label: d.label,
          is_rest: d.is_rest,
          order_index: d.order_index,
        })),
      )
      .select("id, day_of_week");
    if (daysErr || !days) return { ok: false, error: `workout_days: ${daysErr?.message ?? "no rows returned"}` };

    const byWeekday = new Map(days.map((d) => [d.day_of_week, d.id]));
    const exercises = blueprint.days.flatMap((d) => {
      const dayId = byWeekday.get(d.day_of_week);
      if (!dayId) return [];
      return d.exercises.map((e) => ({
        day_id: dayId,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        notes: e.notes,
        order_index: e.order_index,
      }));
    });

    if (exercises.length > 0) {
      const { error: exErr } = await admin.from("exercises").insert(exercises);
      if (exErr) return { ok: false, error: `exercises: ${exErr.message}` };
    }
  }

  return { ok: true, created: true, planIds };
}
