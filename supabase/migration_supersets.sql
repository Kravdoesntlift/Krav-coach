-- Migration: add superset_group to exercises
-- Run in Supabase SQL Editor

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS superset_group text DEFAULT NULL;

COMMENT ON COLUMN exercises.superset_group IS 'Letter (A, B, C…) grouping exercises into supersets. Exercises with the same letter are performed back-to-back.';
