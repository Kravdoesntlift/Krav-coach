-- ============================================================
-- KRAV Coach - Premium Features Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Client status + subscription on profiles
alter table public.profiles
  add column if not exists status text not null default 'active'
    check (status in ('active', 'paused', 'cancelled')),
  add column if not exists subscription_renews_at date;

-- 2. Workout logs (actual weights per exercise session)
create table if not exists public.workout_logs (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  exercise_name text not null,
  day_id        uuid references public.workout_days(id) on delete set null,
  logged_at     date not null default current_date,
  sets          jsonb not null default '[]',
  created_at    timestamptz not null default now()
);

alter table public.workout_logs enable row level security;

create policy "Clients manage their own logs"
  on public.workout_logs for all
  using (client_id = auth.uid());

create policy "Coaches can view logs of their clients"
  on public.workout_logs for select
  using (
    exists (
      select 1 from public.workout_plans wp
      where wp.coach_id = auth.uid() and wp.client_id = client_id
    )
  );

-- 3. Messages (chat coach <-> client)
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can view their own messages"
  on public.messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "Users can send messages"
  on public.messages for insert
  with check (sender_id = auth.uid());

create policy "Receivers can mark as read"
  on public.messages for update
  using (receiver_id = auth.uid());

-- 4. Progress photos
create table if not exists public.progress_photos (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  photo_url  text not null,
  caption    text,
  taken_at   date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.progress_photos enable row level security;

create policy "Clients manage their own photos"
  on public.progress_photos for all
  using (client_id = auth.uid());

create policy "Coaches can view photos of their clients"
  on public.progress_photos for select
  using (
    exists (
      select 1 from public.workout_plans wp
      where wp.coach_id = auth.uid() and wp.client_id = client_id
    )
  );

-- 5. Client onboarding questionnaire
create table if not exists public.client_onboarding (
  client_id       uuid primary key references public.profiles(id) on delete cascade,
  goal            text check (goal in ('lose_weight','gain_muscle','maintain','athletic','health')),
  level           text check (level in ('beginner','intermediate','advanced')),
  available_days  int[] default '{}',
  injuries        text,
  completed_at    timestamptz not null default now()
);

alter table public.client_onboarding enable row level security;

create policy "Clients manage their own onboarding"
  on public.client_onboarding for all
  using (client_id = auth.uid());

create policy "Coaches can view onboarding of their clients"
  on public.client_onboarding for select
  using (
    exists (
      select 1 from public.workout_plans wp
      where wp.coach_id = auth.uid() and wp.client_id = client_id
    )
  );

-- 6. Plan templates (coach reusable plans)
create table if not exists public.plan_templates (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  days       jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.plan_templates enable row level security;

create policy "Coaches manage their own templates"
  on public.plan_templates for all
  using (coach_id = auth.uid());

-- Storage bucket for progress photos (run manually in Supabase Dashboard)
-- Storage > New bucket > name: progress-photos > Public: ON
