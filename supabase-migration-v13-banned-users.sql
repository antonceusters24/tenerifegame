-- Add is_banned column to users table for dynamic ban management
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
