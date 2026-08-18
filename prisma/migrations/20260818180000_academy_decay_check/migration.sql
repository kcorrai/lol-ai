-- LA-24 / ADR-027. Mastery decays, and the nightly job needs to know which rows it has
-- already judged — without this column it re-measures every mastered lesson every night.
--
-- Hand-written for the same reason as 20260818090000_add_creator_profiles: schema.prisma has
-- drifted from the migration history (LA-15), so `prisma migrate dev` attaches thirty-odd
-- unrelated statements to anything it generates. That drift predates this work and none of it
-- belongs in a migration that adds one nullable column.

-- AlterTable
ALTER TABLE "academy_progress" ADD COLUMN "decayCheckedAt" TIMESTAMP(3);

-- The job reads mastered rows in check order, so it should not scan the table to find them.
CREATE INDEX "academy_progress_status_decayCheckedAt_idx" ON "academy_progress"("status", "decayCheckedAt");
