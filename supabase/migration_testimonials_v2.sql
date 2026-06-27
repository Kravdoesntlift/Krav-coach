-- ============================================================
-- KRAV Coach — Testimonials v2
-- Add rating, source and would_recommend columns
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS rating          INTEGER CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS source          TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'trial')),
  ADD COLUMN IF NOT EXISTS would_recommend BOOLEAN;

-- Allow clients to INSERT their own trial feedback (previously only UPDATE was allowed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'testimonials'
      AND policyname = 'client_insert_trial_feedback'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "client_insert_trial_feedback" ON testimonials
        FOR INSERT
        WITH CHECK (client_id = auth.uid() AND source = 'trial');
    $policy$;
  END IF;
END
$$;
