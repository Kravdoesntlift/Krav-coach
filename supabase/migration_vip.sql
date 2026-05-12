-- ============================================================
-- KRAV Coach - VIP Features Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Avatar URL + coach branding in profiles
alter table public.profiles
  add column if not exists avatar_url  text,
  add column if not exists tagline     text;  -- coach only: shown to clients

-- 2. Private coach notes (internal, not visible to client)
create table if not exists public.coach_notes (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  client_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  updated_at  timestamptz not null default now(),
  unique (coach_id, client_id)
);

alter table public.coach_notes enable row level security;

create policy "Coaches manage their own notes"
  on public.coach_notes for all
  using (coach_id = auth.uid());

-- 3. Storage bucket for avatars (run separately in Storage tab if needed)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage policies (run after creating bucket)
-- create policy "Anyone can view avatars" on storage.objects for select using (bucket_id = 'avatars');
-- create policy "Users can upload their own avatar" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Users can update their own avatar" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
