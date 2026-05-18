-- Fix all coach RLS policies to allow access via coach_clients (not only workout_plans).
-- Clients without a plan were invisible to the coach for check-ins, photos, completions, PRs.

-- ── Helper: is this user the coach of the given client? ─────────────────────
-- (used inline in each policy below)

-- ── 1. weekly_checkins ───────────────────────────────────────────────────────
drop policy if exists "Coaches can view checkins of their clients" on public.weekly_checkins;

create policy "Coaches can view checkins of their clients"
  on public.weekly_checkins for select
  using (
    exists (
      select 1 from public.coach_clients cc
      where cc.coach_id = auth.uid() and cc.client_id = weekly_checkins.client_id
    )
    or
    exists (
      select 1 from public.workout_plans wp
      where wp.coach_id = auth.uid() and wp.client_id = weekly_checkins.client_id
    )
  );

-- ── 2. progress_photos ───────────────────────────────────────────────────────
drop policy if exists "Coaches can view photos of their clients" on public.progress_photos;

create policy "Coaches can view photos of their clients"
  on public.progress_photos for select
  using (
    exists (
      select 1 from public.coach_clients cc
      where cc.coach_id = auth.uid() and cc.client_id = progress_photos.client_id
    )
    or
    exists (
      select 1 from public.workout_plans wp
      where wp.coach_id = auth.uid() and wp.client_id = progress_photos.client_id
    )
  );

-- ── 3. workout_completions ───────────────────────────────────────────────────
drop policy if exists "Coaches can view completions of their clients" on public.workout_completions;

create policy "Coaches can view completions of their clients"
  on public.workout_completions for select
  using (
    exists (
      select 1 from public.coach_clients cc
      where cc.coach_id = auth.uid()
        and cc.client_id = workout_completions.client_id
    )
    or
    exists (
      select 1 from public.workout_days wd
      join public.workout_plans wp on wp.id = wd.plan_id
      where wd.id = workout_completions.day_id and wp.coach_id = auth.uid()
    )
  );

-- ── 4. personal_records ──────────────────────────────────────────────────────
drop policy if exists "Coaches can view PRs of their clients" on public.personal_records;

create policy "Coaches can view PRs of their clients"
  on public.personal_records for select
  using (
    exists (
      select 1 from public.coach_clients cc
      where cc.coach_id = auth.uid() and cc.client_id = personal_records.client_id
    )
    or
    exists (
      select 1 from public.workout_plans wp
      where wp.coach_id = auth.uid() and wp.client_id = personal_records.client_id
    )
  );

-- ── 5. progress_photos angle column (if not exists) ─────────────────────────
alter table public.progress_photos
  add column if not exists angle text check (angle in ('front', 'side', 'back'));
