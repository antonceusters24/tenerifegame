-- Migration v8: Add admin creator tracking, bonus points, and bonus_completed on assignments

-- 1. Add new columns to challenges
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS created_by_admin text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS bonus_description text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS bonus_points integer DEFAULT 0;

-- 2. Add bonus_completed to assignments
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS bonus_completed boolean DEFAULT false;

-- 3. Recreate scoreboard view to include bonus points
DROP VIEW IF EXISTS scoreboard;
CREATE VIEW scoreboard AS
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
LEFT JOIN assignments a ON a.user_id = u.id
LEFT JOIN challenges c ON c.id = a.challenge_id
WHERE u.role = 'player'
GROUP BY u.id, u.name
ORDER BY total_points DESC;
