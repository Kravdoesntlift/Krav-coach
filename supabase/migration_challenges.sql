-- Migration: challenges + push_subscriptions
-- Run in Supabase SQL Editor after migration_premium.sql

-- ─────────────────────────────────────────
-- Weekly challenges
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = all clients
  title           TEXT NOT NULL,
  description     TEXT,
  target_type     TEXT NOT NULL CHECK (target_type IN ('workouts','checkins','weight_logs','custom')),
  target_count    INT NOT NULL DEFAULT 1,
  week_start      DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach manages own challenges"
  ON challenges FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Clients view their challenges"
  ON challenges FOR SELECT
  USING (client_id = auth.uid() OR client_id IS NULL);

-- ─────────────────────────────────────────
-- Challenge progress tracking
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_count   INT NOT NULL DEFAULT 0,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, client_id)
);

ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own challenge progress"
  ON challenge_progress FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY "Coach views challenge progress"
  ON challenge_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = challenge_progress.challenge_id
        AND c.coach_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- Push subscriptions (Web Push)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription    JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscription"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- Allow service role to read all push subscriptions (for sending notifications)
CREATE POLICY "Service role reads all subscriptions"
  ON push_subscriptions FOR SELECT
  USING (true);
