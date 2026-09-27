-- A coach may link a YouTube video introducing themselves; nothing is hosted (ADR-021, ADR-063).
ALTER TABLE "coach_profiles" ADD COLUMN "introVideoUrl" TEXT;
