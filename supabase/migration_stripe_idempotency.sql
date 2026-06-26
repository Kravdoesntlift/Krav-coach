-- Stripe webhook idempotency: prevent duplicate processing of invoice.paid etc.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS stripe_processed_events (
  id           text        PRIMARY KEY,   -- Stripe event ID (evt_xxx)
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Periodically clean events older than 30 days (Stripe retries for max 3 days)
-- You can run this manually or via a pg_cron job:
-- DELETE FROM stripe_processed_events WHERE processed_at < now() - interval '30 days';

-- RLS: only accessible via service role (no client access needed)
ALTER TABLE stripe_processed_events ENABLE ROW LEVEL SECURITY;
