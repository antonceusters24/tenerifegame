-- 1. Update categories: remove old ones, add "Gotcha" and "Doe opdracht"
DELETE FROM categories WHERE name NOT IN ('Gotcha', 'Doe opdracht');

INSERT INTO categories (name, description)
SELECT 'Gotcha', 'Doe iets stiekem bij iemand anders'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Gotcha');

INSERT INTO categories (name, description)
SELECT 'Doe opdracht', 'Voer een opdracht uit'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Doe opdracht');

-- 2. Add requires_target flag to challenges (does this challenge need a target lad?)
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS requires_target boolean DEFAULT false;

-- 3. Add target_player_name to assignments (who is the target lad?)
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS target_player_name text;
