-- Leads table (public lead capture form)
CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  source text DEFAULT 'guia',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can submit the form
CREATE POLICY "Anyone can insert leads" ON leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only coaches can read leads
CREATE POLICY "Coaches can read leads" ON leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- If table already exists, add the unique constraint on email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_email_key'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_email_key UNIQUE (email);
  END IF;
END $$;
