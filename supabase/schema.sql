-- ============================================================
-- KRAV Coach - Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default)
-- create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- Extends auth.users with role and display name
-- ============================================================
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text not null,
  role        text not null default 'client' check (role in ('client', 'coach')),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Coaches can read all profiles; clients can only read their own
create policy "Coaches can view all profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'coach'
    )
  );

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do nothing;   -- idempotent: no error if profile already exists
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- WORKOUT PLANS
-- A plan is assigned by a coach to a specific client
-- ============================================================
create table if not exists public.workout_plans (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  client_id   uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  week_start  date not null,
  created_at  timestamptz not null default now()
);

alter table public.workout_plans enable row level security;

create policy "Coaches can manage their plans"
  on public.workout_plans for all
  using (coach_id = auth.uid());

create policy "Clients can view their own plans"
  on public.workout_plans for select
  using (client_id = auth.uid());

-- ============================================================
-- WORKOUT DAYS
-- Each day within a workout plan (0=Sun, 1=Mon, ..., 6=Sat)
-- ============================================================
create table if not exists public.workout_days (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references public.workout_plans(id) on delete cascade,
  day_of_week  int not null check (day_of_week between 0 and 6),
  label        text,
  order_index  int not null default 0
);

alter table public.workout_days enable row level security;

create policy "Access workout_days via plan access"
  on public.workout_days for all
  using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = plan_id
        and (wp.coach_id = auth.uid() or wp.client_id = auth.uid())
    )
  );

-- ============================================================
-- EXERCISES
-- Exercises within a workout day
-- ============================================================
create table if not exists public.exercises (
  id           uuid primary key default gen_random_uuid(),
  day_id       uuid not null references public.workout_days(id) on delete cascade,
  name         text not null,
  sets         int not null,
  reps         text not null,  -- e.g. "8-12", "10", "AMRAP"
  notes        text,
  order_index  int not null default 0
);

alter table public.exercises enable row level security;

create policy "Access exercises via plan access"
  on public.exercises for all
  using (
    exists (
      select 1
      from public.workout_days wd
      join public.workout_plans wp on wp.id = wd.plan_id
      where wd.id = day_id
        and (wp.coach_id = auth.uid() or wp.client_id = auth.uid())
    )
  );

-- ============================================================
-- WORKOUT COMPLETIONS
-- Client marks a workout day as done
-- ============================================================
create table if not exists public.workout_completions (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  day_id        uuid not null references public.workout_days(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  unique (client_id, day_id)
);

alter table public.workout_completions enable row level security;

create policy "Clients manage their own completions"
  on public.workout_completions for all
  using (client_id = auth.uid());

create policy "Coaches can view completions of their clients"
  on public.workout_completions for select
  using (
    exists (
      select 1
      from public.workout_days wd
      join public.workout_plans wp on wp.id = wd.plan_id
      where wd.id = day_id and wp.coach_id = auth.uid()
    )
  );

-- ============================================================
-- WEEKLY CHECK-INS
-- Client submits weekly progress data
-- ============================================================
create table if not exists public.weekly_checkins (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  week_start    date not null,
  weight_kg     numeric(5,2),
  energy_level  int check (energy_level between 1 and 5),
  notes         text,
  created_at    timestamptz not null default now(),
  unique (client_id, week_start)
);

alter table public.weekly_checkins enable row level security;

create policy "Clients manage their own checkins"
  on public.weekly_checkins for all
  using (client_id = auth.uid());

create policy "Coaches can view checkins of their clients"
  on public.weekly_checkins for select
  using (
    exists (
      select 1 from public.workout_plans wp
      where wp.coach_id = auth.uid() and wp.client_id = client_id
    )
  );

-- ============================================================
-- HELPER: get current user role
-- ============================================================
create or replace function public.get_my_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;
