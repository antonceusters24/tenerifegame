-- Migration v10: Chinese Fucking sessions (replaces simple scores table)
-- Each session records points per player. Winner = highest points that session.

CREATE TABLE IF NOT EXISTS cf_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  day integer NOT NULL DEFAULT 1,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb
  -- scores format: {"Lander": 5, "Berten": 3, "Dries": 8, "Anton": 2}
);

-- Enable RLS
ALTER TABLE cf_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "cf_sessions_select" ON cf_sessions FOR SELECT USING (true);

-- Allow inserts/updates (app checks for Anton server-side)
CREATE POLICY "cf_sessions_insert" ON cf_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "cf_sessions_delete" ON cf_sessions FOR DELETE USING (true);
