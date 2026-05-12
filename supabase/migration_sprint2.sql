-- ============================================================
-- KRAV Coach — Sprint 2 migrations
-- Run in Supabase SQL Editor after all previous migrations
-- ============================================================

-- ── 1. Daily logs (quick daily energy check-in) ───────────────────────────
create table if not exists public.daily_logs (
  id         uuid default gen_random_uuid() primary key,
  client_id  uuid not null references public.profiles(id) on delete cascade,
  logged_at  date not null default current_date,
  energy     int  check (energy between 1 and 5),
  note       text,
  created_at timestamptz default now(),
  unique(client_id, logged_at)
);

alter table public.daily_logs enable row level security;
create policy "Clients manage own daily logs"
  on public.daily_logs for all using (auth.uid() = client_id) with check (auth.uid() = client_id);
create policy "Coaches view client daily logs"
  on public.daily_logs for select
  using (exists (
    select 1 from public.coach_clients cc where cc.coach_id = auth.uid() and cc.client_id = client_id
  ));

-- ── 2. Exercise library ───────────────────────────────────────────────────
create table if not exists public.exercise_library (
  id             uuid default gen_random_uuid() primary key,
  coach_id       uuid not null references public.profiles(id) on delete cascade,
  name           text not null,
  muscle_groups  text[] default '{}',
  description    text,
  video_url      text,
  created_at     timestamptz default now()
);

alter table public.exercise_library enable row level security;
create policy "Coach manages own library"
  on public.exercise_library for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

-- ── 3. Coach automations ──────────────────────────────────────────────────
create table if not exists public.coach_automations (
  id               uuid default gen_random_uuid() primary key,
  coach_id         uuid not null references public.profiles(id) on delete cascade,
  name             text not null,
  trigger_type     text not null,   -- 'no_workout_days' | 'no_checkin_days' | 'perfect_week' | 'checkin_monday'
  trigger_value    int  default 3,  -- days threshold (for 'no_workout_days', 'no_checkin_days')
  message_template text not null,   -- can use {{nome}} placeholder
  is_active        boolean not null default true,
  created_at       timestamptz default now()
);

alter table public.coach_automations enable row level security;
create policy "Coach manages own automations"
  on public.coach_automations for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

create table if not exists public.coach_automation_logs (
  id            uuid default gen_random_uuid() primary key,
  automation_id uuid not null references public.coach_automations(id) on delete cascade,
  client_id     uuid not null references public.profiles(id) on delete cascade,
  sent_at       timestamptz default now()
);

alter table public.coach_automation_logs enable row level security;
create policy "Coach views own automation logs"
  on public.coach_automation_logs for select
  using (exists (select 1 from public.coach_automations ca where ca.id = automation_id and ca.coach_id = auth.uid()));
create index if not exists idx_automation_logs_auto_client
  on public.coach_automation_logs(automation_id, client_id, sent_at desc);

-- ── 4. Coaching sessions (booking) ───────────────────────────────────────
create table if not exists public.coaching_sessions (
  id               uuid default gen_random_uuid() primary key,
  coach_id         uuid not null references public.profiles(id) on delete cascade,
  client_id        uuid references public.profiles(id) on delete set null,
  scheduled_at     timestamptz not null,
  duration_min     int  default 60,
  session_type     text default 'online',    -- 'online' | 'presencial'
  location_or_link text,
  notes            text,
  status           text default 'confirmed', -- 'confirmed' | 'cancelled' | 'completed'
  created_at       timestamptz default now()
);

alter table public.coaching_sessions enable row level security;
create policy "Coach manages own sessions"
  on public.coaching_sessions for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
create policy "Client views own sessions"
  on public.coaching_sessions for select using (auth.uid() = client_id);
create index if not exists idx_sessions_coach on public.coaching_sessions(coach_id, scheduled_at);
create index if not exists idx_sessions_client on public.coaching_sessions(client_id, scheduled_at);

-- ── 5. Client transformations (public results gallery) ───────────────────
create table if not exists public.client_transformations (
  id             uuid default gen_random_uuid() primary key,
  coach_id       uuid not null references public.profiles(id) on delete cascade,
  display_name   text not null,   -- e.g., "João M." — coach writes this, never real name
  before_url     text not null,
  after_url      text not null,
  duration_weeks int,
  highlight      text,            -- e.g., "-15kg em 12 semanas"
  is_public      boolean not null default true,
  created_at     timestamptz default now()
);

alter table public.client_transformations enable row level security;
create policy "Coach manages own transformations"
  on public.client_transformations for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
create policy "Public can read public transformations"
  on public.client_transformations for select using (is_public = true);

-- Storage bucket for transformation photos (run separately in dashboard if not exists)
-- insert into storage.buckets (id, name, public) values ('transformations', 'transformations', true) on conflict do nothing;

-- ── 6. Stripe subscriptions ───────────────────────────────────────────────
alter table public.profiles add column if not exists stripe_customer_id text;

create table if not exists public.stripe_subscriptions (
  id                   text primary key,  -- Stripe subscription ID
  coach_id             uuid not null references public.profiles(id) on delete cascade,
  client_id            uuid not null references public.profiles(id) on delete cascade,
  status               text not null,     -- 'active' | 'past_due' | 'cancelled' | 'trialing'
  price_id             text,
  amount_cents         int,
  currency             text default 'eur',
  current_period_end   timestamptz,
  cancel_at_period_end boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.stripe_subscriptions enable row level security;
create policy "Coach views own stripe subscriptions"
  on public.stripe_subscriptions for select using (auth.uid() = coach_id);
create policy "Client views own stripe subscriptions"
  on public.stripe_subscriptions for select using (auth.uid() = client_id);
