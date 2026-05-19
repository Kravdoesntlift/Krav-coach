export type Role = "client" | "coach";
export type ClientStatus = "active" | "paused" | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
  avatar_url?: string | null;
  tagline?: string | null;
  status?: ClientStatus;
  subscription_renews_at?: string | null;
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

export const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DAY_NAMES_FULL = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
