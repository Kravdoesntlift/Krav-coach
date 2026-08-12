-- Allow billing-driven statuses on profiles.
-- Without these, the Stripe webhook silently fails to lock accounts on
-- payment failure (CHECK constraint rejects the UPDATE and the error is ignored).
-- Run in Supabase SQL Editor.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('active', 'paused', 'cancelled', 'archived', 'pending', 'past_due', 'trialing'));
