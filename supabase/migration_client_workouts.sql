-- Client self-logged workouts (manual + imported from Strava/Apple Health)
-- Run in Supabase SQL Editor

create table if not exists public.client_workouts (
  id             uuid default gen_random_uuid() primary key,
  client_id      uuid not null references public.profiles(id) on delete cascade,
  date           date not null default current_date,
  title          text not null,
  type           text check (type in ('strength','cardio','sports','yoga','mobility','other')),
  duration_min   integer check (duration_min > 0),
  calories       integer check (calories >= 0),
  distance_km    numeric(6,2),
  avg_heart_rate integer,
  notes          text,
  source         text default 'manual' check (source in ('manual','strava','apple_health','garmin')),
  external_id    text,
  created_at     timestamptz default now()
);

-- Prevent duplicate imports from Strava/other providers
create unique index if not exists client_workouts_external_idx
  on public.client_workouts (client_id, source, external_id)
  where external_id is not null;

alter table public.client_workouts enable row level security;

-- Clients manage their own workouts
create policy "Clients manage own workouts"
  on public.client_workouts for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- Coaches can read workouts of their clients
create policy "Coaches read client workouts"
  on public.client_workouts for select
  using (
    exists (
      select 1 from public.coach_clients
      where coach_id = auth.uid() and client_id = client_workouts.client_id
    )
  );
