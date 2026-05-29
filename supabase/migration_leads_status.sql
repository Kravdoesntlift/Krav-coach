-- Add status tracking to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_at timestamptz;

-- Allow coaches to update leads (status, notes)
CREATE POLICY "Coaches can update leads" ON leads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  )
  WITH CHECK (true);

-- Allow coaches to delete leads
CREATE POLICY "Coaches can delete leads" ON leads
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );
