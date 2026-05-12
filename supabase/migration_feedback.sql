-- ============================================================
-- KRAV Coach - Feedback semanal do coach
-- Run this in Supabase SQL Editor (after schema.sql)
-- ============================================================

create table if not exists public.coach_feedback (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  client_id   uuid not null references public.profiles(id) on delete cascade,
  week_start  date not null,
  message     text not null,
  created_at  timestamptz not null default now(),
  unique (coach_id, client_id, week_start)
);

alter table public.coach_feedback enable row level security;

create policy "Coaches manage their own feedback"
  on public.coach_feedback for all
  using (coach_id = auth.uid());

create policy "Clients can view feedback addressed to them"
  on public.coach_feedback for select
  using (client_id = auth.uid());
