-- ============================================================
-- KRAV Coach - Phase 3 & 4 migrations
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Rest days flag on workout_days
alter table public.workout_days
  add column if not exists is_rest boolean not null default false;

-- 2. Video URL on exercises
alter table public.exercises
  add column if not exists video_url text;

-- 3. Body measurements on weekly_checkins
alter table public.weekly_checkins
  add column if not exists waist_cm  numeric(5,1),
  add column if not exists chest_cm  numeric(5,1),
  add column if not exists arm_cm    numeric(5,1);

-- 4. Personal records
create table if not exists public.personal_records (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  exercise_name text not null,
  weight_kg     numeric(6,2),
  reps          int,
  notes         text,
  recorded_at   timestamptz not null default now()
);

alter table public.personal_records enable row level security;

create policy "Clients manage their own records"
  on public.personal_records for all
  using (client_id = auth.uid());

create policy "Coaches can view PRs of their clients"
  on public.personal_records for select
  using (
    exists (
      select 1 from public.workout_plans wp
      where wp.coach_id = auth.uid() and wp.client_id = client_id
    )
  );
