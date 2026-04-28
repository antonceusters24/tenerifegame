-- Migration v5b: Update chinese_fucking_scores (drop losses, add points)
-- Run this if you already ran the original v5 migration

-- Drop the losses column
ALTER TABLE chinese_fucking_scores DROP COLUMN IF EXISTS losses;

-- Add points column
ALTER TABLE chinese_fucking_scores ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;
