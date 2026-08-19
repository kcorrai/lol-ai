-- Match timeline capture (LA-45, ADR-033): the rest of a Match-V5 timeline payload we were
-- already fetching in full and discarding all but CHAMPION_KILL from.
--
-- Hand-written rather than generated, per LA-15: `migrate dev` diffs the whole schema against the
-- migration history and would sweep five unrelated index drops and a column drop into this file.
--
-- Both tables key on the match alone, not on a riot account the way match_death_events does. A
-- match is captured once whoever is in it, and "your gold against your lane opponent's" is
-- expressible at all — which a per-player capture cannot do.

-- CreateEnum
CREATE TYPE "TimelineEventKind" AS ENUM (
    'CHAMPION_KILL',
    'CHAMPION_SPECIAL_KILL',
    'WARD_PLACED',
    'WARD_KILL',
    'ITEM_PURCHASED',
    'ITEM_SOLD',
    'SKILL_LEVEL_UP',
    'LEVEL_UP',
    'ELITE_MONSTER_KILL',
    'BUILDING_KILL',
    'TURRET_PLATE_DESTROYED'
);

-- CreateTable
-- One participant's state at one minute. Riot samples on frameInterval (60_000ms), so `minute`
-- is the frame index. Ten participants over a 35-minute game is ~350 rows.
CREATE TABLE "match_timeline_frames" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "participantId" INTEGER NOT NULL,
    "puuid" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,
    "timestampMs" INTEGER NOT NULL,
    "currentGold" INTEGER NOT NULL,
    "totalGold" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "minionsKilled" INTEGER NOT NULL,
    "jungleMinionsKilled" INTEGER NOT NULL,

    CONSTRAINT "match_timeline_frames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- The kind-specific tail lives in `payload`: the eleven kinds share almost no fields, so a column
-- per facet would be forty mostly-null columns and a migration for every new Riot event kind.
CREATE TABLE "match_timeline_events" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "kind" "TimelineEventKind" NOT NULL,
    "timestampMs" INTEGER NOT NULL,
    "participantId" INTEGER,
    "puuid" TEXT,
    "positionX" INTEGER,
    "positionY" INTEGER,
    "payload" JSONB NOT NULL,

    CONSTRAINT "match_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- This is what makes the capture idempotent: it re-runs through createMany(skipDuplicates) and
-- cannot double-write, so it needs no transaction.
CREATE UNIQUE INDEX "match_timeline_frames_matchId_participantId_minute_key"
    ON "match_timeline_frames"("matchId", "participantId", "minute");

-- CreateIndex
-- The lane-phase chart reads exactly two players out of one match.
CREATE INDEX "match_timeline_frames_matchId_puuid_idx"
    ON "match_timeline_frames"("matchId", "puuid");

-- CreateIndex
CREATE INDEX "match_timeline_events_matchId_kind_idx"
    ON "match_timeline_events"("matchId", "kind");

-- CreateIndex
CREATE INDEX "match_timeline_events_matchId_puuid_idx"
    ON "match_timeline_events"("matchId", "puuid");

-- AddForeignKey
ALTER TABLE "match_timeline_frames" ADD CONSTRAINT "match_timeline_frames_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_timeline_events" ADD CONSTRAINT "match_timeline_events_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
