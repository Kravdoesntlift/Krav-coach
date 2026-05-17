CREATE TABLE IF NOT EXISTS weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  -- Treinos
  workouts_completed integer DEFAULT 0,
  workouts_total integer DEFAULT 0,
  -- Check-in
  weight_kg numeric(5,2),
  weight_change numeric(5,2),        -- diferença face à semana anterior
  waist_cm numeric(5,1),
  waist_change numeric(5,1),
  energy_avg numeric(3,1),           -- média de energy_level (1-5)
  -- AI
  ai_message text,                   -- parágrafo gerado pelo Groq em nome do coach
  -- Fotos (URLs para comparação)
  photo_before_url text,             -- foto mais antiga (frente)
  photo_latest_url text,             -- foto mais recente (frente)
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, week_start)
);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_read_own_reports" ON weekly_reports
  FOR SELECT TO authenticated USING (auth.uid() = client_id);

CREATE POLICY "coaches_read_client_reports" ON weekly_reports
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_id = auth.uid() AND client_id = weekly_reports.client_id
    )
  );

GRANT SELECT ON weekly_reports TO authenticated;
GRANT ALL ON weekly_reports TO service_role;
