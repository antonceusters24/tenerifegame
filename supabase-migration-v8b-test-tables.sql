-- Migration v8b: Create test tables (mirrors of challenges/assignments) for test branch

-- 1. Test challenges table (same schema as challenges + new v8 columns)
CREATE TABLE IF NOT EXISTS challenges_test (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points integer NOT NULL DEFAULT 10,
  requires_target boolean DEFAULT false,
  created_by_admin text,
  bonus_description text,
  bonus_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. Test assignments table (same schema as assignments + bonus_completed)
CREATE TABLE IF NOT EXISTS assignments_test (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES challenges_test(id) ON DELETE CASCADE,
  day integer NOT NULL CHECK (day BETWEEN 1 AND 6),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'completed', 'skipped')),
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  target_player_name text,
  bonus_completed boolean DEFAULT false
);

-- 3. Test scoreboard view
CREATE OR REPLACE VIEW scoreboard_test AS
SELECT
  u.id AS user_id,
  u.name,
  COALESCE(SUM(CASE WHEN a.status = 'completed' THEN c.points ELSE 0 END), 0) AS earned_points,
  COALESCE(SUM(CASE WHEN a.status = 'completed' AND a.bonus_completed = true THEN c.bonus_points ELSE 0 END), 0) AS bonus_earned,
  COALESCE(SUM(CASE WHEN a.status = 'skipped' THEN -10 ELSE 0 END), 0) AS penalty_points,
  (
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN c.points ELSE 0 END), 0) +
    COALESCE(SUM(CASE WHEN a.status = 'completed' AND a.bonus_completed = true THEN c.bonus_points ELSE 0 END), 0) +
    COALESCE(SUM(CASE WHEN a.status = 'skipped' THEN -10 ELSE 0 END), 0)
  ) AS total_points,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::int AS completed_count,
  COUNT(CASE WHEN a.status = 'skipped' THEN 1 END)::int AS skipped_count,
  COUNT(CASE WHEN a.status = 'pending' THEN 1 END)::int AS pending_count
FROM users u
LEFT JOIN assignments_test a ON a.user_id = u.id
LEFT JOIN challenges_test c ON c.id = a.challenge_id
WHERE u.role = 'player'
GROUP BY u.id, u.name
ORDER BY total_points DESC;

-- 4. RLS
ALTER TABLE challenges_test ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON challenges_test FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE assignments_test ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON assignments_test FOR ALL USING (true) WITH CHECK (true);
