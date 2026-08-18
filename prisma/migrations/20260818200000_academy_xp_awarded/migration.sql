-- LA-24. XP a lesson has already paid out, so completing it twice — or re-earning a mastery
-- the decay check took back — cannot pay again. Stored as a running total rather than a pair
-- of flags because the total answers every path on its own.
--
-- Hand-written for the same reason as 20260818180000_academy_decay_check: schema.prisma has
-- drifted from the migration history (LA-15) and `prisma migrate dev` attaches unrelated
-- statements to anything it generates.

-- AlterTable
ALTER TABLE "academy_progress" ADD COLUMN "xpAwarded" INTEGER NOT NULL DEFAULT 0;
