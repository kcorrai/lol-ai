-- CreateTable: one row per death event per match per tracked player
CREATE TABLE "match_death_events" (
    "id"            UUID         NOT NULL,
    "matchId"       UUID         NOT NULL,
    "riotAccountId" UUID         NOT NULL,
    "positionX"     INTEGER      NOT NULL,
    "positionY"     INTEGER      NOT NULL,
    "gameTimeMs"    INTEGER      NOT NULL,
    "championName"  TEXT         NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "match_death_events_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "match_death_events_riotAccountId_championName_idx"
    ON "match_death_events"("riotAccountId", "championName");

CREATE INDEX "match_death_events_riotAccountId_gameTimeMs_idx"
    ON "match_death_events"("riotAccountId", "gameTimeMs");

-- Used for dedup check: "has this match already been processed for this account?"
CREATE INDEX "match_death_events_matchId_riotAccountId_idx"
    ON "match_death_events"("matchId", "riotAccountId");

-- FK: cascade delete when match is deleted
ALTER TABLE "match_death_events"
    ADD CONSTRAINT "match_death_events_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK: cascade delete when riot account is deleted
ALTER TABLE "match_death_events"
    ADD CONSTRAINT "match_death_events_riotAccountId_fkey"
    FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
