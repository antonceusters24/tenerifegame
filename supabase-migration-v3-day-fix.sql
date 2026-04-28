-- Fix day constraint from 1-7 to 1-6 (there are only 6 game days)
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_day_check;
ALTER TABLE assignments ADD CONSTRAINT assignments_day_check CHECK (day BETWEEN 1 AND 6);
