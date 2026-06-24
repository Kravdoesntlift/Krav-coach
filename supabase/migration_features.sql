-- ============================================================
-- KRAV Coach — Feature Migration
-- Run in Supabase SQL Editor AFTER migration_phase3.sql
-- ============================================================

-- ─── 1. Testimonials ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  display_name     TEXT NOT NULL DEFAULT '',
  content          TEXT NOT NULL DEFAULT '',
  result_highlight TEXT,
  duration_weeks   INTEGER,
  is_public        BOOLEAN DEFAULT FALSE,
  requested_at     TIMESTAMPTZ,
  submitted_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Coach manages their own testimonials (full CRUD)
CREATE POLICY "coach_manage_testimonials" ON testimonials
  FOR ALL USING (coach_id = auth.uid());

-- Client can read testimonials where they are the client
CREATE POLICY "client_read_own_testimonial" ON testimonials
  FOR SELECT USING (client_id = auth.uid());

-- Client can fill in their content (update)
CREATE POLICY "client_submit_testimonial" ON testimonials
  FOR UPDATE USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Anyone can read public testimonials (for /p/[coachId])
CREATE POLICY "public_read_testimonials" ON testimonials
  FOR SELECT USING (is_public = TRUE);


-- ─── 2. Habit definitions (per client) ───────────────────────
CREATE TABLE IF NOT EXISTS habit_definitions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  emoji      TEXT NOT NULL DEFAULT '✓',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE habit_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_own_habits" ON habit_definitions
  FOR ALL USING (client_id = auth.uid());


-- ─── 3. Habit logs (daily check-off) ─────────────────────────
CREATE TABLE IF NOT EXISTS habit_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  habit_id    UUID REFERENCES habit_definitions(id) ON DELETE CASCADE NOT NULL,
  logged_date DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (habit_id, logged_date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_own_habit_logs" ON habit_logs
  FOR ALL USING (client_id = auth.uid());


-- ─── 4. Meal plans (coach creates, client reads) ─────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  goal       TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_manage_meal_plans" ON meal_plans
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "client_read_meal_plans" ON meal_plans
  FOR SELECT USING (client_id = auth.uid());


-- ─── 5. Meal plan meals (breakfast, lunch, dinner, snack) ────
CREATE TABLE IF NOT EXISTS meal_plan_meals (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id     UUID REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  meal_type   TEXT NOT NULL DEFAULT 'meal',
  name        TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

ALTER TABLE meal_plan_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_manage_plan_meals" ON meal_plan_meals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_meals.plan_id
        AND meal_plans.coach_id = auth.uid()
    )
  );

CREATE POLICY "client_read_plan_meals" ON meal_plan_meals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_meals.plan_id
        AND meal_plans.client_id = auth.uid()
    )
  );


-- ─── 6. Meal plan foods (items in each meal) ─────────────────
CREATE TABLE IF NOT EXISTS meal_plan_foods (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id     UUID REFERENCES meal_plan_meals(id) ON DELETE CASCADE NOT NULL,
  food_name   TEXT NOT NULL,
  quantity    TEXT NOT NULL DEFAULT '100g',
  calories    INTEGER,
  protein_g   NUMERIC(6,1),
  carbs_g     NUMERIC(6,1),
  fat_g       NUMERIC(6,1),
  notes       TEXT,
  order_index INTEGER DEFAULT 0
);

ALTER TABLE meal_plan_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_manage_plan_foods" ON meal_plan_foods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meal_plan_meals
      JOIN meal_plans ON meal_plans.id = meal_plan_meals.plan_id
      WHERE meal_plan_meals.id = meal_plan_foods.meal_id
        AND meal_plans.coach_id = auth.uid()
    )
  );

CREATE POLICY "client_read_plan_foods" ON meal_plan_foods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meal_plan_meals
      JOIN meal_plans ON meal_plans.id = meal_plan_meals.plan_id
      WHERE meal_plan_meals.id = meal_plan_foods.meal_id
        AND meal_plans.client_id = auth.uid()
    )
  );
