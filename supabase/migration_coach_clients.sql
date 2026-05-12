-- ============================================================
-- COACH-CLIENT ASSIGNMENT
-- Run this in Supabase SQL Editor after schema.sql
-- ============================================================

create table if not exists public.coach_clients (
  id              uuid default gen_random_uuid() primary key,
  coach_id        uuid not null references public.profiles(id) on delete cascade,
  client_id       uuid not null references public.profiles(id) on delete cascade,
  assigned_role   text not null default 'coach',   -- 'coach' | 'nutritionist'
  notes           text,
  assigned_at     timestamptz default now(),
  constraint unique_coach_client_role unique(coach_id, client_id, assigned_role)
);

alter table public.coach_clients enable row level security;

-- Coaches can manage their own assignments
create policy "Coach manages own assignments"
  on public.coach_clients for all
  using  (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

-- Clients can see who is assigned to them
create policy "Client views own assignments"
  on public.coach_clients for select
  using (auth.uid() = client_id);

-- Index for fast lookup
create index if not exists idx_coach_clients_coach  on public.coach_clients(coach_id);
create index if not exists idx_coach_clients_client on public.coach_clients(client_id);

-- ── Make client chat work via coach_clients ────────────────────────────────
-- When a coach assigns a client, also allow coach to view that client's profile
-- (existing plan-based RLS already covers this, this is belt-and-suspenders)

-- ── Allow coaches to read ALL client profiles (needed for manage-clients page)
-- Coaches can already read all profiles via existing policy; no change needed.
