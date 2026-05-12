-- ============================================================
-- KRAV Coach - Features Phase 2
-- Run this in Supabase SQL Editor after migration_premium.sql
-- ============================================================

-- ─── 1. CLIENT GOALS ────────────────────────────────────────
create table if not exists public.client_goals (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references public.profiles(id) on delete cascade,
  client_id     uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text,
  target_value  numeric(8,2),
  current_value numeric(8,2) default 0,
  unit          text,                         -- 'kg', 'reps', '%', 'semanas', etc.
  deadline      date,
  completed     boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.client_goals enable row level security;

create policy "Coaches manage goals they created"
  on public.client_goals for all
  using (coach_id = auth.uid());

create policy "Clients read their own goals"
  on public.client_goals for select
  using (client_id = auth.uid());

-- ─── 2. PLAN TEMPLATES ──────────────────────────────────────
create table if not exists public.plan_templates (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  days       jsonb not null default '[]',        -- DayInput[] stored as JSON
  created_at timestamptz not null default now()
);

create table if not exists public.plan_template_days (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references public.plan_templates(id) on delete cascade,
  day_of_week   int not null check (day_of_week between 0 and 6),
  label         text,
  is_rest       boolean not null default false,
  order_index   int not null default 0
);

create table if not exists public.plan_template_exercises (
  id            uuid primary key default gen_random_uuid(),
  template_day_id uuid not null references public.plan_template_days(id) on delete cascade,
  name          text not null,
  sets          int not null default 3,
  reps          int not null default 10,
  notes         text,
  video_url     text,
  order_index   int not null default 0
);

alter table public.plan_templates enable row level security;
alter table public.plan_template_days enable row level security;
alter table public.plan_template_exercises enable row level security;

create policy "Coaches manage their templates"
  on public.plan_templates for all using (coach_id = auth.uid());

create policy "Coaches manage template days"
  on public.plan_template_days for all
  using (exists (
    select 1 from public.plan_templates t
    where t.id = template_id and t.coach_id = auth.uid()
  ));

create policy "Coaches manage template exercises"
  on public.plan_template_exercises for all
  using (exists (
    select 1 from public.plan_template_days ptd
    join public.plan_templates t on t.id = ptd.template_id
    where ptd.id = template_day_id and t.coach_id = auth.uid()
  ));

-- ─── 3. CLIENT ONBOARDING ───────────────────────────────────
-- Table may already exist from migration_premium.sql with old schema.
-- Add new columns if they don't exist yet.
alter table public.client_onboarding
  add column if not exists goals_text    text,
  add column if not exists fitness_level text,
  add column if not exists availability  int default 3,
  add column if not exists equipment     text;

-- Ensure RLS is on
alter table public.client_onboarding enable row level security;

-- Policies (idempotent with DO $$)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'client_onboarding'
    and policyname = 'Coaches read onboarding of their clients'
  ) then
    execute $pol$
      create policy "Coaches read onboarding of their clients"
        on public.client_onboarding for select
        using (exists (
          select 1 from public.workout_plans wp
          where wp.coach_id = auth.uid() and wp.client_id = client_id
        ))
    $pol$;
  end if;
end $$;

-- ─── 4. FEELING column on workout_completions (if not exists) ───
alter table public.workout_completions
  add column if not exists feeling text,
  add column if not exists note    text;
