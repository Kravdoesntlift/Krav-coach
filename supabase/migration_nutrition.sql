-- Basic nutrition tracking
-- Clients log meals with macro estimates; coach can see summaries

create table if not exists nutrition_logs (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references profiles(id) on delete cascade,
  logged_at   date not null default current_date,
  meal_name   text not null,            -- e.g. "Pequeno-almoço", "Almoço"
  description text,                     -- free-text: what they ate
  calories    integer,
  protein_g   integer,
  carbs_g     integer,
  fat_g       integer,
  created_at  timestamptz default now()
);

create index if not exists nutrition_logs_client_date_idx on nutrition_logs (client_id, logged_at desc);

alter table nutrition_logs enable row level security;

create policy "client manage own nutrition"
  on nutrition_logs for all
  using  (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "coach read client nutrition"
  on nutrition_logs for select
  using (
    exists (
      select 1 from workout_plans wp
      where wp.coach_id = auth.uid()
        and wp.client_id = nutrition_logs.client_id
    )
  );
