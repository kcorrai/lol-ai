-- Add AI coaching summary cache fields to champion_stats
ALTER TABLE "champion_stats"
  ADD COLUMN "coachingSummary"   TEXT,
  ADD COLUMN "coachingSummaryAt" TIMESTAMPTZ;
