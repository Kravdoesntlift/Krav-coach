export type Role = "client" | "coach";
export type ClientStatus = "active" | "paused" | "cancelled" | "archived" | "pending";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
  avatar_url?: string | null;
  tagline?: string | null;
  status?: ClientStatus;
  subscription_renews_at?: string | null;
  trial_ends_at?: string | null;
}

export interface WorkoutPlan {
  id: string;
  coach_id: string;
  client_id: string;
  name: string;
  week_start: string;
  created_at: string;
  // joined
  client?: Profile;
  workout_days?: WorkoutDay[];
}

export interface WorkoutDay {
  id: string;
  plan_id: string;
  day_of_week: number; // 0=Sun...6=Sat
  label: string | null;
  order_index: number;
  is_rest: boolean;
  // joined
  exercises?: Exercise[];
  workout_completions?: WorkoutCompletion[];
}

export interface Exercise {
  id: string;
  day_id: string;
  name: string;
  sets: number;
  reps: string;
  notes: string | null;
  video_url: string | null;
  order_index: number;
  superset_group?: string | null;
}

export interface WorkoutCompletion {
  id: string;
  client_id: string;
  day_id: string;
  completed_at: string;
  feeling: string | null;
  note: string | null;
}

export interface WeeklyCheckin {
  id: string;
  client_id: string;
  week_start: string;
  weight_kg: number | null;
  energy_level: number | null;
  notes: string | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  recovery_level: number | null;
  motivation_level: number | null;
  nutrition_adherence: "yes" | "partial" | "no" | null;
  hip_cm: number | null;
  created_at: string;
  // joined
  client?: Profile;
}

export interface PersonalRecord {
  id: string;
  client_id: string;
  exercise_name: string;
  weight_kg: number | null;
  reps: number | null;
  notes: string | null;
  recorded_at: string;
}

export interface WorkoutLog {
  id: string;
  client_id: string;
  exercise_name: string;
  day_id: string | null;
  logged_at: string;
  sets: { weight_kg: number | null; reps: number; done: boolean }[];
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  client_id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string;
  created_at: string;
  angle: "front" | "side" | "back" | null;
}

export interface ClientOnboarding {
  client_id: string;
  goal: string | null;
  level: string | null;
  available_days: number[];
  injuries: string | null;
  completed_at: string;
}

export interface PlanTemplate {
  id: string;
  coach_id: string;
  name: string;
  days: unknown[];
  created_at: string;
}

// ── Sprint 2 types ────────────────────────────────────────────────────────

export interface DailyLog {
  id: string;
  client_id: string;
  logged_at: string; // date
  energy: number | null;
  note: string | null;
  created_at: string;
}

export interface ExerciseLibraryItem {
  id: string;
  coach_id: string;
  name: string;
  muscle_groups: string[];
  description: string | null;
  video_url: string | null;
  created_at: string;
}

export interface CoachAutomation {
  id: string;
  coach_id: string;
  name: string;
  trigger_type: "no_workout_days" | "no_checkin_days" | "perfect_week" | "checkin_monday";
  trigger_value: number;
  message_template: string;
  is_active: boolean;
  created_at: string;
}

export interface CoachingSession {
  id: string;
  coach_id: string;
  client_id: string | null;
  scheduled_at: string;
  duration_min: number;
  session_type: "online" | "presencial";
  location_or_link: string | null;
  notes: string | null;
  status: "confirmed" | "cancelled" | "completed";
  created_at: string;
}

export interface ClientTransformation {
  id: string;
  coach_id: string;
  display_name: string;
  before_url: string;
  after_url: string;
  duration_weeks: number | null;
  highlight: string | null;
  is_public: boolean;
  created_at: string;
}

export interface StripeSubscription {
  id: string;
  coach_id: string;
  client_id: string;
  status: "active" | "past_due" | "cancelled" | "trialing";
  price_id: string | null;
  amount_cents: number | null;
  currency: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface NutritionLog {
  id: string;
  client_id: string;
  logged_at: string;
  meal_name: string;
  description: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  vit_c_mg: number | null;
  vit_d_mcg: number | null;
  vit_b12_mcg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  potassium_mg: number | null;
  magnesium_mg: number | null;
  food_id: string | null;
  serving_g: number | null;
  created_at: string;
}

export interface ClientNutritionGoals {
  client_id: string;
  goal: "cut" | "maintenance" | "bulk";
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  sex: "M" | "F" | null;
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  updated_at: string;
}

export interface ReferralCode {
  id: string;
  client_id: string;
  code: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_email: string | null;
  referred_user_id: string | null;
  status: "pending" | "signed_up" | "active";
  bonus_granted: boolean;
  created_at: string;
}

// ── Feature types ─────────────────────────────────────────────────────────────

export interface Testimonial {
  id: string;
  coach_id: string;
  client_id: string | null;
  display_name: string;
  content: string;
  result_highlight: string | null;
  duration_weeks: number | null;
  is_public: boolean;
  requested_at: string | null;
  submitted_at: string | null;
  created_at: string;
}

export interface HabitDefinition {
  id: string;
  client_id: string;
  name: string;
  emoji: string;
  created_at: string;
}

export interface HabitLog {
  id: string;
  client_id: string;
  habit_id: string;
  logged_date: string;
  created_at: string;
}

export interface MealPlan {
  id: string;
  coach_id: string;
  client_id: string;
  name: string;
  goal: string | null;
  notes: string | null;
  created_at: string;
  // joined
  meal_plan_meals?: MealPlanMeal[];
}

export interface MealPlanMeal {
  id: string;
  plan_id: string;
  meal_type: string;
  name: string;
  order_index: number;
  // joined
  meal_plan_foods?: MealPlanFood[];
}

export interface MealPlanFood {
  id: string;
  meal_id: string;
  food_name: string;
  quantity: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  order_index: number;
}

// Day numbering follows JavaScript's Date.getDay(): 0 = Sunday … 6 = Saturday.
// Everything that stores a weekday (workout_days.day_of_week,
// client_onboarding.available_days) uses this and only this. Index these arrays
// directly with the stored number: never re-base it.
export const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Display order for a training week (Monday first), as JS day numbers. */
export const WEEK_ORDER_MON_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

/**
 * Position of a JS weekday within a Monday-first training week: Mon = 0 ... Sun = 6.
 *
 * A training week runs Monday to Sunday, but `day_of_week` follows
 * Date.getDay(), where Sunday is 0. Sorting on the raw number therefore lists
 * Sunday before Monday, at the top of a week it actually ends. This is the same
 * conversion the dashboard already applies when it maps a day onto a date.
 */
export function weekPosition(dayOfWeek: number): number {
  return (dayOfWeek + 6) % 7;
}

/** Sort comparator for workout days, Monday first and Sunday last. */
export function byWeekOrder(
  a: { day_of_week: number },
  b: { day_of_week: number },
): number {
  return weekPosition(a.day_of_week) - weekPosition(b.day_of_week);
}
export const DAY_NAMES_FULL = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
