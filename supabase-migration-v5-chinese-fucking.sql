-- Chinese Fucking scoreboard (wins + cumulative points, only Anton can update)
CREATE TABLE IF NOT EXISTS chinese_fucking_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name text NOT NULL UNIQUE,
  wins integer DEFAULT 0,
  points integer DEFAULT 0
);

-- Seed the 4 players
INSERT INTO chinese_fucking_scores (player_name, wins, points)
VALUES 
  ('Lander', 0, 0),
  ('Berten', 0, 0),
  ('Dries', 0, 0),
  ('Anton', 0, 0)
ON CONFLICT (player_name) DO NOTHING;
