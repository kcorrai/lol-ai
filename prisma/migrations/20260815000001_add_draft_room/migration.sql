-- CreateEnum
CREATE TYPE "DraftSeriesMode" AS ENUM ('NORMAL', 'FEARLESS', 'TEAM_FEARLESS');

-- CreateEnum
CREATE TYPE "DraftSideEnum" AS ENUM ('BLUE', 'RED');

-- CreateEnum
CREATE TYPE "DraftGamePhase" AS ENUM ('LOBBY', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "DraftActionKind" AS ENUM ('BAN', 'PICK');

-- CreateTable
CREATE TABLE "draft_series" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "blueToken" TEXT NOT NULL,
    "redToken" TEXT NOT NULL,
    "team1Name" TEXT NOT NULL,
    "team2Name" TEXT NOT NULL,
    "mode" "DraftSeriesMode" NOT NULL DEFAULT 'NORMAL',
    "gameCount" INTEGER NOT NULL DEFAULT 1,
    "timerSeconds" INTEGER NOT NULL DEFAULT 30,
    "disabledChampions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draft_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_games" (
    "id" UUID NOT NULL,
    "seriesId" UUID NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "blueTeam" INTEGER NOT NULL DEFAULT 1,
    "phase" "DraftGamePhase" NOT NULL DEFAULT 'LOBBY',
    "step" INTEGER NOT NULL DEFAULT 0,
    "blueReady" BOOLEAN NOT NULL DEFAULT false,
    "redReady" BOOLEAN NOT NULL DEFAULT false,
    "turnStartedAt" TIMESTAMP(3),
    "winnerSide" "DraftSideEnum",
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "draft_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_actions" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "step" INTEGER NOT NULL,
    "side" "DraftSideEnum" NOT NULL,
    "kind" "DraftActionKind" NOT NULL,
    "championKey" TEXT,
    "timedOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "draft_series_code_key" ON "draft_series"("code");

-- CreateIndex
CREATE UNIQUE INDEX "draft_series_blueToken_key" ON "draft_series"("blueToken");

-- CreateIndex
CREATE UNIQUE INDEX "draft_series_redToken_key" ON "draft_series"("redToken");

-- CreateIndex
CREATE INDEX "draft_series_expiresAt_idx" ON "draft_series"("expiresAt");

-- CreateIndex
CREATE INDEX "draft_series_createdById_idx" ON "draft_series"("createdById");

-- CreateIndex
CREATE INDEX "draft_games_seriesId_idx" ON "draft_games"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "draft_games_seriesId_gameNumber_key" ON "draft_games"("seriesId", "gameNumber");

-- CreateIndex
CREATE INDEX "draft_actions_gameId_idx" ON "draft_actions"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "draft_actions_gameId_step_key" ON "draft_actions"("gameId", "step");

-- AddForeignKey
ALTER TABLE "draft_series" ADD CONSTRAINT "draft_series_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_games" ADD CONSTRAINT "draft_games_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "draft_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_actions" ADD CONSTRAINT "draft_actions_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "draft_games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
