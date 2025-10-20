import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://ynqdybfppcwkuxalsidt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWR5YmZwcGN3a3V4YWxzaWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NjYyMzEsImV4cCI6MjA3NjI0MjIzMX0.xeVMeHfg8hUiCc37iWw1pEW2jnH6dPbSH1jrbKJZZVg';

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
CREATE TABLE IF NOT EXISTS quickscan_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sector text NOT NULL,
  fte text NOT NULL,
  omzet_range text NOT NULL,
  data_maturiteit text NOT NULL,
  bottleneck text NOT NULL,
  doel_analyse text NOT NULL,
  numerieke_score integer DEFAULT 0,
  sterktes text[] DEFAULT '{}',
  verbeterpunten text[] DEFAULT '{}',
  advies text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quickscan_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own quickscan responses" ON quickscan_responses;
CREATE POLICY "Users can read own quickscan responses"
  ON quickscan_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own quickscan responses" ON quickscan_responses;
CREATE POLICY "Users can create own quickscan responses"
  ON quickscan_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and consultants can read all responses" ON quickscan_responses;
CREATE POLICY "Admins and consultants can read all responses"
  ON quickscan_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'consultant')
    )
  );
`;

const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('Error:', error);
  process.exit(1);
} else {
  console.log('Migration applied successfully!');
}
