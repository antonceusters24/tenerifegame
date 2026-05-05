-- Migration v8c: Create confirmations_test table for test branch

CREATE TABLE IF NOT EXISTS confirmations_test (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments_test(id) ON DELETE CASCADE,
  confirmed_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id, confirmed_by)
);

ALTER TABLE confirmations_test ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON confirmations_test FOR ALL USING (true) WITH CHECK (true);
