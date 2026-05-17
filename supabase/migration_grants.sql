-- ============================================================
-- EXPLICIT GRANTS — required from October 30, 2026
-- Supabase will no longer auto-grant public schema access.
-- Run this once; future tables need their own GRANT block.
-- ============================================================

-- Helper: tables that only authenticated users should access
-- (anon = unauthenticated visitors, authenticated = logged-in users)

grant select, insert, update, delete
  on public.profiles
  to authenticated;

grant select, insert, update, delete
  on public.workout_plans
  to authenticated;

grant select, insert, update, delete
  on public.workout_days
  to authenticated;

grant select, insert, update, delete
  on public.exercises
  to authenticated;

grant select, insert, update, delete
  on public.workout_completions
  to authenticated;

grant select, insert, update, delete
  on public.weekly_checkins
  to authenticated;

grant select, insert, update, delete
  on public.messages
  to authenticated;

grant select, insert, update, delete
  on public.progress_photos
  to authenticated;

grant select, insert, update, delete
  on public.client_onboarding
  to authenticated;

grant select, insert, update, delete
  on public.coach_clients
  to authenticated;

grant select, insert, update, delete
  on public.coach_feedback
  to authenticated;

grant select, insert, update, delete
  on public.coach_notes
  to authenticated;

grant select, insert, update, delete
  on public.personal_records
  to authenticated;

grant select, insert, update, delete
  on public.workout_logs
  to authenticated;

grant select, insert, update, delete
  on public.plan_templates
  to authenticated;

grant select, insert, update, delete
  on public.plan_template_days
  to authenticated;

grant select, insert, update, delete
  on public.plan_template_exercises
  to authenticated;

grant select, insert, update, delete
  on public.daily_logs
  to authenticated;

grant select, insert, update, delete
  on public.exercise_library
  to authenticated;

grant select, insert, update, delete
  on public.coach_automations
  to authenticated;

grant select, insert, update, delete
  on public.coach_automation_logs
  to authenticated;

grant select, insert, update, delete
  on public.coaching_sessions
  to authenticated;

grant select, insert, update, delete
  on public.client_goals
  to authenticated;

grant select, insert, update, delete
  on public.client_transformations
  to authenticated;

grant select, insert, update, delete
  on public.stripe_subscriptions
  to authenticated;

-- push_subscriptions (if exists)
grant select, insert, update, delete
  on public.push_subscriptions
  to authenticated;

-- service_role bypasses RLS already, but explicit grant future-proofs it
grant all
  on all tables in schema public
  to service_role;

-- ============================================================
-- TEMPLATE PARA TABELAS FUTURAS — copia este bloco em cada
-- nova migração quando criares uma tabela nova:
-- ============================================================
-- grant select, insert, update, delete
--   on public.NOME_DA_TABELA
--   to authenticated;
--
-- grant all
--   on public.NOME_DA_TABELA
--   to service_role;
-- ============================================================
