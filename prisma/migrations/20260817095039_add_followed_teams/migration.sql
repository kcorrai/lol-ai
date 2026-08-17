-- TASK-313. The one table the esports section owns.
--
-- Hand-written. `prisma migrate dev` generated this file with thirty-odd
-- unrelated statements attached — dropping five indexes and the
-- `match_death_events.createdAt` column — because schema.prisma has drifted
-- from the migration history. That drift is real and predates this task; it is
-- filed separately. None of it belongs in a migration that adds one table, so
-- everything but the table was removed by hand.

-- CreateTable
CREATE TABLE "followed_teams" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "followed_teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "followed_teams_userId_createdAt_idx" ON "followed_teams"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "followed_teams_userId_teamId_key" ON "followed_teams"("userId", "teamId");

-- AddForeignKey
ALTER TABLE "followed_teams" ADD CONSTRAINT "followed_teams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
