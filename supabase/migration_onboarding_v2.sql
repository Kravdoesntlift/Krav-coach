-- Migration: extend client_onboarding with body profile + session duration
-- Run in Supabase SQL Editor

ALTER TABLE public.client_onboarding
  ADD COLUMN IF NOT EXISTS biological_sex      text CHECK (biological_sex IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS age                 smallint CHECK (age BETWEEN 10 AND 100),
  ADD COLUMN IF NOT EXISTS height_cm           smallint CHECK (height_cm BETWEEN 100 AND 250),
  ADD COLUMN IF NOT EXISTS current_weight_kg   numeric(5,1) CHECK (current_weight_kg > 0),
  ADD COLUMN IF NOT EXISTS session_duration    smallint CHECK (session_duration IN (30, 45, 60, 90));
