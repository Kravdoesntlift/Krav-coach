-- Allow coaches to see photos of clients assigned via coach_clients
-- (the old policy only allowed via workout_plans)

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

-- Add angle column if not exists (used by the structured photo upload)
alter table public.progress_photos
  add column if not exists angle text check (angle in ('front', 'side', 'back'));
