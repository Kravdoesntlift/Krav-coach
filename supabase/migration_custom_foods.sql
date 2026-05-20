-- Custom foods: user-created food entries
create table if not exists custom_foods (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references profiles(id) on delete cascade,
  name          text not null,
  brand         text,
  calories_100g numeric(7,1) not null,
  protein_100g  numeric(6,2) default 0,
  carbs_100g    numeric(6,2) default 0,
  fat_100g      numeric(6,2) default 0,
  fiber_100g    numeric(6,2),
  created_at    timestamptz default now()
);
alter table custom_foods enable row level security;
create policy "client manage own custom foods"
  on custom_foods for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- Custom recipes: named meal recipes made from ingredients
create table if not exists custom_recipes (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references profiles(id) on delete cascade,
  name        text not null,
  portions    integer not null default 1,
  calories    numeric(7,1),
  protein_g   numeric(6,2),
  carbs_g     numeric(6,2),
  fat_g       numeric(6,2),
  fiber_g     numeric(6,2),
  created_at  timestamptz default now()
);
alter table custom_recipes enable row level security;
create policy "client manage own custom recipes"
  on custom_recipes for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create table if not exists custom_recipe_items (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references custom_recipes(id) on delete cascade,
  food_name     text not null,
  grams         numeric(7,1) not null,
  calories_100g numeric(7,1),
  protein_100g  numeric(6,2),
  carbs_100g    numeric(6,2),
  fat_100g      numeric(6,2)
);
