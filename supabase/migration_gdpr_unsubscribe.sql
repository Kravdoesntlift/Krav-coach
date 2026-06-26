-- GDPR Art.º 21 — unsubscribe support for leads drip emails
-- Run in Supabase SQL Editor after migration_feedback.sql

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz DEFAULT NULL;

-- Index for the IS NULL filter used by leads-drip cron
CREATE INDEX IF NOT EXISTS idx_leads_unsubscribed
  ON leads (unsubscribed_at)
  WHERE unsubscribed_at IS NULL;
