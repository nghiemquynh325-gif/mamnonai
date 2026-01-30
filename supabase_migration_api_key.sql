-- Migration: Add api_key column to profiles table
-- Purpose: Store user's Gemini API key in database instead of localStorage

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS api_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.api_key IS 'User''s Gemini API key for AI generation';
