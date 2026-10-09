import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildBasePlan, isBasePlan, type BasePlan, type BasePlanInput, type Equipment, type Goal, type Level } from "./base-plan";
import {
  buildProgram90Week,
  is90DaysPlan,
  program90State,
  program90WeekFor,
} from "./program90";
import { tierForAmount } from "@/lib/billing/tiers";

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
 * the coaching tier buys is the coach reading the answers and writing a plan
 * against them, which is a different thing and has to stay a different thing.
 *
 * It also runs every week, not only once: somebody paying for the app tier
 * would otherwise run out of plan the moment the two weeks written during the
 * trial ran out. Every fourth week is lighter, which is what the guide asks
 * for and what nobody does on their own.
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

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Whether this client should be getting plans written by the app.
 *
 * Trial: yes, that is the whole trial. App tier: yes, that is what it is.
 * Coaching tier: no. Writing an automatic week for somebody paying 127 euros
 * for a coach to write it would be the worst bug in the product, so the check
 * fails closed: anything unclear means no automatic plan.
 */
async function entitledToBasePlans(
  admin: Admin,
  clientId: string,
): Promise<{ entitled: true } | { entitled: false; reason: string }> {
  const [{ data: profile }, { data: subs }] = await Promise.all([
    admin.from("profiles").select("trial_ends_at").eq("id", clientId).maybeSingle(),
    admin
      .from("stripe_subscriptions")
      .select("status, amount_cents")
      .eq("client_id", clientId)
      .in("status", ["active", "trialing"])
      .order("current_period_end", { ascending: false })
      .limit(1),
  ]);

  const live = subs?.[0];
  if (live) {
    const tier = tierForAmount(live.amount_cents);
    if (tier === "app") return { entitled: true };
    return { entitled: false, reason: "coaching tier: the coach writes this plan" };
  }

  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at as string) : null;
  if (trialEnds && trialEnds.getTime() > Date.now()) return { entitled: true };

  // No live subscription and no running trial. The client layout will not let
  // them in anyway; writing plans for them would just be noise.
  return { entitled: false, reason: "no live subscription and no running trial" };
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
  const coachId = await resolveCoachId(admin, clientId, args.coachId ?? null);
  if (!coachId) return { ok: false, error: "no coach to attach the plan to" };

  // Which weeks this call is responsible for, and which of them are empty.
  // A week the coach has already written into is covered: the automatic plan
  // never lands on top of a plan a person wrote.
  const firstMonday = mondayOf();
  const wantedWeeks = Array.from({ length: weeks }, (_, i) => addWeeks(firstMonday, i));

  const { data: existing, error: existingErr } = await admin
    .from("workout_plans")
    .select("id, name, week_start")
    .eq("client_id", clientId);
  if (existingErr) return { ok: false, error: `looking for existing plans: ${existingErr.message}` };

  const covered = new Set((existing ?? []).map((p) => p.week_start as string));
  const missing = wantedWeeks.filter((w) => !covered.has(w));
  if (missing.length === 0) return { ok: true, created: false, reason: "weeks already covered" };

  // Who gets an automatic plan: anyone still in the trial, and anyone paying
  // for the app tier. Coaching clients do not, because their plan is the
  // thing they are paying a person to write.
  const eligible = await entitledToBasePlans(admin, clientId);
  if (!eligible.entitled) return { ok: true, created: false, reason: eligible.reason };

  // How many base weeks this client has had, so every fourth one is lighter.
  const baseWeeksSoFar = (existing ?? []).filter((p) => isBasePlan(p.name as string)).length;

  // Whether they are part way through the 90 Days programme, read from the
  // names of the plans they already have.
  const program = program90State(
    (existing ?? []).map((p) => ({ name: p.name as string | null, week_start: p.week_start as string })),
  );

  const input = await planInputFor(admin, clientId);

  const planIds: string[] = [];

  for (const weekStart of missing) {
    // The week already in progress starts today, so nothing is owed for days
    // that are already gone. Later weeks are the full split.
    const inProgress = weekStart === firstMonday;
    const startOnWeekday = inProgress ? new Date().getUTCDay() : null;

    // Somebody following the 90 Days programme gets that week, not the
    // generic one. The week comes from the calendar, so a missed week is
    // picked up where the programme is rather than where they stopped.
    const programWeek = program.enrolled && program.startMonday
      ? program90WeekFor(program.startMonday, weekStart)
      : null;

    const weekNumber = baseWeeksSoFar + missing.indexOf(weekStart) + 1;
    const blueprint = programWeek
      ? buildProgram90Week(programWeek, { ...input, startOnWeekday })
      : buildBasePlan({
          ...input,
          deload: weekNumber % 4 === 0,
          startOnWeekday,
        });
    const written = await writeWeek(admin, { clientId, coachId, weekStart, blueprint });
    if (!written.ok) return { ok: false, error: written.error };
    if (written.planId) planIds.push(written.planId);
  }

  return { ok: true, created: true, planIds };
}

/**
 * One week on disk: the plan, its days, its exercises.
 *
 * Shared by the weekly provisioning and by somebody starting the 90 Days
 * programme, because two copies of this would drift and only one of them
 * would be the copy anybody tested.
 */
async function writeWeek(
  admin: Admin,
  args: { clientId: string; coachId: string; weekStart: string; blueprint: BasePlan },
): Promise<{ ok: true; planId: string | null } | { ok: false; error: string }> {
  const { clientId, coachId, weekStart, blueprint } = args;
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
    if ((count ?? 0) > 0) return { ok: true, planId: null };
  }

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

  return { ok: true, planId };
}

/** What the generator needs about this person: their answers and their language. */
async function planInputFor(admin: Admin, clientId: string): Promise<BasePlanInput> {
  const [{ data: onboarding }, { data: profile }] = await Promise.all([
    admin
      .from("client_onboarding")
      .select("fitness_level, level, equipment, goal, available_days, availability, session_duration")
      .eq("client_id", clientId)
      .maybeSingle(),
    admin.from("profiles").select("lang").eq("id", clientId).maybeSingle(),
  ]);

  return {
    level: asOneOf(onboarding?.level ?? onboarding?.fitness_level, LEVELS),
    equipment: asOneOf(onboarding?.equipment, EQUIPMENT),
    goal: asOneOf(onboarding?.goal, GOALS),
    trainingDays: Array.isArray(onboarding?.available_days) ? (onboarding!.available_days as number[]) : [],
    daysPerWeek: typeof onboarding?.availability === "number" ? onboarding.availability : null,
    sessionMinutes: typeof onboarding?.session_duration === "number" ? onboarding.session_duration : null,
    lang: profile?.lang === "en" ? "en" : "pt",
  };
}

/** The coach a plan hangs off, however little the caller knows. */
async function resolveCoachId(admin: Admin, clientId: string, given?: string | null): Promise<string | null> {
  if (given) return given;
  const { data: link } = await admin
    .from("coach_clients")
    .select("coach_id")
    .eq("client_id", clientId)
    .eq("assigned_role", "coach")
    .maybeSingle();
  if (link?.coach_id) return link.coach_id as string;
  const { data: coach } = await admin.from("profiles").select("id").eq("role", "coach").limit(1).maybeSingle();
  return (coach?.id as string) ?? null;
}

/** Whether anything has been logged against a week, which makes it theirs. */
async function weekWasTouched(admin: Admin, planId: string): Promise<boolean> {
  const { data: days } = await admin.from("workout_days").select("id").eq("plan_id", planId);
  const ids = (days ?? []).map((d) => d.id as string);
  if (ids.length === 0) return false;

  const [{ count: done }, { count: logged }] = await Promise.all([
    admin.from("workout_completions").select("id", { count: "exact", head: true }).in("day_id", ids),
    admin.from("workout_logs").select("id", { count: "exact", head: true }).in("day_id", ids),
  ]);
  return (done ?? 0) > 0 || (logged ?? 0) > 0;
}

export type StartProgramResult =
  | { ok: true; started: true; startMonday: string; replacedThisWeek: boolean }
  | { ok: true; started: false; reason: string }
  | { ok: false; error: string };

/**
 * Put somebody on the thirteen weeks of the book, from this week if possible.
 *
 * The one rule is that nothing they have already trained gets overwritten. An
 * automatic week nobody has touched is replaced without ceremony; a week with
 * a single set logged against it, or a week the coach wrote, is left alone and
 * the programme starts on the following Monday.
 */
export async function startProgram90(args: { clientId: string }): Promise<StartProgramResult> {
  const { clientId } = args;
  const admin = createAdminClient();

  const eligible = await entitledToBasePlans(admin, clientId);
  if (!eligible.entitled) return { ok: true, started: false, reason: eligible.reason };

  const coachId = await resolveCoachId(admin, clientId);
  if (!coachId) return { ok: false, error: "no coach to attach the plan to" };

  const { data: existing, error: existingErr } = await admin
    .from("workout_plans")
    .select("id, name, week_start")
    .eq("client_id", clientId);
  if (existingErr) return { ok: false, error: `looking for existing plans: ${existingErr.message}` };

  const plans = (existing ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string | null,
    week_start: p.week_start as string,
  }));

  const state = program90State(plans);
  if (state.enrolled && !state.finished) {
    return { ok: true, started: false, reason: "already following the programme" };
  }

  const thisMonday = mondayOf();
  const nextMonday = addWeeks(thisMonday, 1);

  /** An automatic week nobody has trained is ours to replace. Anything else is theirs. */
  const canReplace = async (plan: { id: string; name: string | null } | undefined) => {
    if (!plan) return true;
    const automatic = isBasePlan(plan.name) || is90DaysPlan(plan.name);
    if (!automatic) return false;
    return !(await weekWasTouched(admin, plan.id));
  };
  const dropWeek = async (weekStart: string) => {
    const plan = plans.find((p) => p.week_start === weekStart);
    if (plan) await admin.from("workout_plans").delete().eq("id", plan.id);
  };

  // Block one is four weeks of a specific shape, and the first of them should
  // not be a Friday with one session in it. Monday to Wednesday the programme
  // starts now; later in the week it starts on the coming Monday and this
  // week stays as it is.
  const weekday = new Date().getUTCDay();
  const earlyEnough = weekday >= 1 && weekday <= 3;

  let startMonday = thisMonday;
  let replacedThisWeek = false;

  if (earlyEnough && (await canReplace(plans.find((p) => p.week_start === thisMonday)))) {
    await dropWeek(thisMonday);
    replacedThisWeek = plans.some((p) => p.week_start === thisMonday);
  } else {
    startMonday = nextMonday;
  }

  // Whichever Monday it starts on, the first two weeks of the programme need
  // the room: an untouched automatic week there is replaced too.
  for (const weekStart of [startMonday, addWeeks(startMonday, 1)]) {
    if (weekStart === thisMonday && startMonday === thisMonday) continue;
    if (!(await canReplace(plans.find((p) => p.week_start === weekStart)))) {
      if (weekStart === startMonday) {
        return { ok: true, started: false, reason: "that week already has a plan somebody wrote" };
      }
      continue;
    }
    await dropWeek(weekStart);
  }

  const input = await planInputFor(admin, clientId);
  const inProgress = startMonday === thisMonday;

  const first = await writeWeek(admin, {
    clientId,
    coachId,
    weekStart: startMonday,
    blueprint: buildProgram90Week(1, {
      ...input,
      startOnWeekday: inProgress ? new Date().getUTCDay() : null,
    }),
  });
  if (!first.ok) return { ok: false, error: first.error };

  // The week after, so the programme does not stop at the first Sunday. Only
  // when it is free: ensureBasePlan writes it on the next visit otherwise.
  const second = await writeWeek(admin, {
    clientId,
    coachId,
    weekStart: addWeeks(startMonday, 1),
    blueprint: buildProgram90Week(2, { ...input, startOnWeekday: null }),
  });
  if (!second.ok) return { ok: false, error: second.error };

  return { ok: true, started: true, startMonday, replacedThisWeek };
}
