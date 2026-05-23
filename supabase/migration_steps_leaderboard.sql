-- Migration: daily_health_logs + monthly_challenges
-- Run this in Supabase SQL Editor

-- 1. Daily health logs (steps + water per client per day)
CREATE TABLE IF NOT EXISTS daily_health_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date      date NOT NULL DEFAULT CURRENT_DATE,
  steps         integer NOT NULL DEFAULT 0 CHECK (steps >= 0),
  water_ml      integer NOT NULL DEFAULT 0 CHECK (water_ml >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, log_date)
);

ALTER TABLE daily_health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients can manage own health logs"
  ON daily_health_logs
  FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "coaches can view client health logs"
  ON daily_health_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients cc
      WHERE cc.coach_id = auth.uid()
        AND cc.client_id = daily_health_logs.client_id
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_daily_health_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_health_logs_updated_at
  BEFORE UPDATE ON daily_health_logs
  FOR EACH ROW EXECUTE FUNCTION update_daily_health_logs_updated_at();


-- 2. Monthly challenges (coach sets reward, tracks winner)
CREATE TABLE IF NOT EXISTS monthly_challenges (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month                 date NOT NULL, -- first day of month, e.g. 2026-05-01
  reward_title          text NOT NULL,
  reward_description    text,
  reward_image_url      text,
  -- Scoring weights (coach can customize)
  points_per_workout    integer NOT NULL DEFAULT 10,
  points_per_checkin    integer NOT NULL DEFAULT 15,
  points_per_nutrition  integer NOT NULL DEFAULT 5,  -- per day with nutrition log
  points_per_1000_steps integer NOT NULL DEFAULT 2,  -- per 1000 steps
  -- Winner
  winner_client_id      uuid REFERENCES profiles(id),
  winner_announced      boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, month)
);

ALTER TABLE monthly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches can manage own challenges"
  ON monthly_challenges
  FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "clients can view challenges from their coach"
  ON monthly_challenges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients cc
      JOIN profiles p ON p.id = cc.client_id
      WHERE p.id = auth.uid()
        AND cc.coach_id = monthly_challenges.coach_id
    )
  );

CREATE OR REPLACE FUNCTION update_monthly_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monthly_challenges_updated_at
  BEFORE UPDATE ON monthly_challenges
  FOR EACH ROW EXECUTE FUNCTION update_monthly_challenges_updated_at();
