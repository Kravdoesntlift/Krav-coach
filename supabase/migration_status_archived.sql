-- Add 'archived' to the profiles.status CHECK constraint
-- Previous constraint only allowed: 'active', 'paused', 'cancelled'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('active', 'paused', 'cancelled', 'archived', 'pending'));
