-- ─── Multi-device push subscriptions ─────────────────────────────────────────
-- Replace UNIQUE(user_id) with UNIQUE(user_id, endpoint) so each device
-- gets its own row. This allows a coach to receive notifications on both
-- desktop and mobile simultaneously.

-- 1. Drop the old single-device unique constraint
ALTER TABLE push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_key;

-- 2. Add endpoint column (extracted from subscription JSON for the unique key)
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS endpoint text
  GENERATED ALWAYS AS (subscription->>'endpoint') STORED;

-- 3. New unique constraint: one row per user+device
ALTER TABLE push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_endpoint_key
  UNIQUE (user_id, endpoint);

-- 4. Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);
