-- Add hotStreak and inactive columns to ranked_history
-- These were present in the schema but missing from production DB
-- because they were added to the init migration after the DB was provisioned.

ALTER TABLE "ranked_history"
  ADD COLUMN IF NOT EXISTS "hotStreak" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "inactive"  BOOLEAN NOT NULL DEFAULT false;
