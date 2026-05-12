-- Migration: check-in v2 — adiciona qualidade de sono e nível de stress
-- Corre no Supabase SQL Editor

ALTER TABLE weekly_checkins
  ADD COLUMN IF NOT EXISTS sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS stress_level  INTEGER CHECK (stress_level  BETWEEN 1 AND 5);
