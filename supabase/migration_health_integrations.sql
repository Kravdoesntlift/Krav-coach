-- Migration: fitness integrations (Apple Health Shortcuts, Strava, Google Fit)
-- Run this in Supabase SQL Editor

-- 1. health_tokens — unique token per client for webhook-based sync (Apple Shortcuts)
CREATE TABLE IF NOT EXISTS health_tokens (
  client_id   uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  sync_token  uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE health_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients can view own health token"
  ON health_tokens
  FOR SELECT
  USING (client_id = auth.uid());

-- Service role (admin client) can manage all tokens
CREATE POLICY "service role can manage health tokens"
  ON health_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. health_integrations — OAuth tokens for Strava / Google Fit
CREATE TABLE IF NOT EXISTS health_integrations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider          text NOT NULL CHECK (provider IN ('strava', 'google_fit', 'fitbit', 'garmin')),
  access_token      text NOT NULL,
  refresh_token     text,
  token_expires_at  timestamptz,
  provider_user_id  text,
  is_active         boolean NOT NULL DEFAULT true,
  last_synced_at    timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, provider)
);

ALTER TABLE health_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients can view own integrations"
  ON health_integrations
  FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "clients can delete own integrations"
  ON health_integrations
  FOR DELETE
  USING (client_id = auth.uid());

CREATE POLICY "service role can manage all integrations"
  ON health_integrations
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_health_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER health_integrations_updated_at
  BEFORE UPDATE ON health_integrations
  FOR EACH ROW EXECUTE FUNCTION update_health_integrations_updated_at();
