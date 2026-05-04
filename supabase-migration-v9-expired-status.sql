-- Migration v9: Add "expired" status (auto-expired, no penalty) distinct from "skipped" (manual, -10pts)

-- 1. Update CHECK constraint on assignments to allow 'expired'
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_status_check;
ALTER TABLE assignments ADD CONSTRAINT assignments_status_check
  CHECK (status IN ('active', 'pending', 'completed', 'skipped', 'expired'));

-- 2. Same for assignments_test
ALTER TABLE assignments_test DROP CONSTRAINT IF EXISTS assignments_test_status_check;
ALTER TABLE assignments_test ADD CONSTRAINT assignments_test_status_check
  CHECK (status IN ('active', 'pending', 'completed', 'skipped', 'expired'));

-- 3. Recreate scoreboard view: only "skipped" gets -10, "expired" gets 0
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
  COUNT(CASE WHEN a.status = 'expired' THEN 1 END)::int AS expired_count,
  COUNT(CASE WHEN a.status = 'pending' THEN 1 END)::int AS pending_count
FROM users u
LEFT JOIN assignments a ON a.user_id = u.id
LEFT JOIN challenges c ON c.id = a.challenge_id
WHERE u.role = 'player'
GROUP BY u.id, u.name
ORDER BY total_points DESC;

-- 4. Recreate scoreboard_test view
DROP VIEW IF EXISTS scoreboard_test;
CREATE VIEW scoreboard_test AS
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
  COUNT(CASE WHEN a.status = 'expired' THEN 1 END)::int AS expired_count,
  COUNT(CASE WHEN a.status = 'pending' THEN 1 END)::int AS pending_count
FROM users u
LEFT JOIN assignments_test a ON a.user_id = u.id
LEFT JOIN challenges_test c ON c.id = a.challenge_id
WHERE u.role = 'player'
GROUP BY u.id, u.name
ORDER BY total_points DESC;
