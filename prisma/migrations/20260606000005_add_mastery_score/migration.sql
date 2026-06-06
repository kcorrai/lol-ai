-- AlterTable: champion_stats — add mastery score columns
ALTER TABLE "champion_stats"
  ADD COLUMN "masteryScore"     INTEGER,
  ADD COLUMN "masterySubScores" JSONB,
  ADD COLUMN "masteryScoreAt"   TIMESTAMPTZ;
