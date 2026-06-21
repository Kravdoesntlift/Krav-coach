-- 7-day free trial for new clients
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
