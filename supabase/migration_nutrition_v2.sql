-- Nutrition v2: add micronutrient columns + nutrition goals table

-- Add new columns to nutrition_logs
alter table nutrition_logs
  add column if not exists fiber_g    numeric(6,1),
  add column if not exists sugar_g    numeric(6,1),
  add column if not exists sodium_mg  integer,
  add column if not exists vit_c_mg   numeric(6,2),
  add column if not exists vit_d_mcg  numeric(6,2),
  add column if not exists vit_b12_mcg numeric(6,2),
  add column if not exists calcium_mg integer,
  add column if not exists iron_mg    numeric(6,2),
  add column if not exists potassium_mg integer,
  add column if not exists magnesium_mg integer,
  add column if not exists food_id    text,
  add column if not exists serving_g  integer;

-- Daily nutrition goals / TDEE settings per client
create table if not exists client_nutrition_goals (
  client_id      uuid primary key references profiles(id) on delete cascade,
  goal           text not null default 'maintenance' check (goal in ('cut','maintenance','bulk')),
  weight_kg      numeric(5,1),
  height_cm      integer,
  age            integer,
  sex            text check (sex in ('M','F')),
  activity_level text not null default 'moderate'
    check (activity_level in ('sedentary','light','moderate','active','very_active')),
  target_calories  integer,
  target_protein_g integer,
  target_carbs_g   integer,
  target_fat_g     integer,
  updated_at     timestamptz default now()
);

alter table client_nutrition_goals enable row level security;

create policy "client manage own nutrition goals"
  on client_nutrition_goals for all
  using  (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "coach read client nutrition goals"
  on client_nutrition_goals for select
  using (
    exists (select 1 from workout_plans wp where wp.coach_id = auth.uid() and wp.client_id = client_nutrition_goals.client_id)
    or exists (select 1 from coach_clients cc where cc.coach_id = auth.uid() and cc.client_id = client_nutrition_goals.client_id)
  );

-- Also fix the nutrition_logs RLS to allow coaches via coach_clients (not just workout_plans)
drop policy if exists "coach read client nutrition" on nutrition_logs;
create policy "coach read client nutrition"
  on nutrition_logs for select
  using (
    client_id = auth.uid()
    or exists (select 1 from workout_plans wp where wp.coach_id = auth.uid() and wp.client_id = nutrition_logs.client_id)
    or exists (select 1 from coach_clients cc where cc.coach_id = auth.uid() and cc.client_id = nutrition_logs.client_id)
  );
