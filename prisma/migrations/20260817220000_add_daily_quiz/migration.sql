-- LA-20. The two tables the daily quiz owns.
--
-- Hand-written, for the same reason 20260817095039_add_followed_teams was:
-- schema.prisma has drifted from the migration history (LA-15), so
-- `prisma migrate dev` attaches thirty-odd unrelated statements — dropping five
-- indexes and the `match_death_events.createdAt` column — to whatever it is
-- asked to generate. None of that belongs in a migration that adds two tables.
--
-- The puzzles themselves are deliberately not stored. The answer is derived from
-- the UTC date in dailySeed.ts, so an anonymous visitor plays with no row at all
-- and there is no nightly job that can leave a day blank. These tables hold only
-- what has to outlive a browser: a signed-in player's results and their streak.

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "puzzleDate" DATE NOT NULL,
    "mode" TEXT NOT NULL,
    "guesses" TEXT[],
    "guessCount" INTEGER NOT NULL DEFAULT 0,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "gaveUp" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_streaks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "longest" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedDate" DATE,
    "freezesLeft" INTEGER NOT NULL DEFAULT 1,
    "freezeWeekKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quiz_attempts_userId_puzzleDate_idx" ON "quiz_attempts"("userId", "puzzleDate");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_userId_puzzleDate_mode_key" ON "quiz_attempts"("userId", "puzzleDate", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_streaks_userId_key" ON "quiz_streaks"("userId");

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_streaks" ADD CONSTRAINT "quiz_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
