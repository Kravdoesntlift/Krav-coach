-- Fix 1: ensure progress-photos bucket exists and is public
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', true)
on conflict (id) do update set public = true;

-- Fix 2: storage policies so clients can upload and coaches/clients can read
-- (idempotent — drop and recreate)
drop policy if exists "Clients can upload their own photos" on storage.objects;
drop policy if exists "Anyone can read progress photos" on storage.objects;
drop policy if exists "Clients can delete their own photos" on storage.objects;

create policy "Clients can upload their own photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can read progress photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'progress-photos');

create policy "Clients can delete their own photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Fix 3: ensure progress_photos table has RLS on and the right policies
alter table public.progress_photos enable row level security;

-- Client: full access to their own photos
drop policy if exists "Clients manage their own photos" on public.progress_photos;
create policy "Clients manage their own photos"
  on public.progress_photos for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- Coach: read any photo from their clients (via coach_clients OR workout_plans)
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

-- angle column (safe to run even if already exists)
alter table public.progress_photos
  add column if not exists angle text check (angle in ('front', 'side', 'back'));
