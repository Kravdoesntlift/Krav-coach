-- Migration: extend weekly_checkins with recovery, motivation, nutrition adherence, hip
-- Run in Supabase SQL Editor

ALTER TABLE public.weekly_checkins
  ADD COLUMN IF NOT EXISTS recovery_level      smallint CHECK (recovery_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS motivation_level    smallint CHECK (motivation_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS nutrition_adherence text CHECK (nutrition_adherence IN ('yes', 'partial', 'no')),
  ADD COLUMN IF NOT EXISTS hip_cm              numeric(5,1) CHECK (hip_cm > 0);
