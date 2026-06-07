-- CreateTable: season/split performance snapshot
CREATE TABLE "season_recaps" (
    "id"          UUID         NOT NULL,
    "userId"      UUID         NOT NULL,
    "seasonLabel" TEXT         NOT NULL,
    "shareToken"  TEXT         NOT NULL,
    "data"        JSONB        NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublic"    BOOLEAN      NOT NULL DEFAULT true,
    CONSTRAINT "season_recaps_pkey" PRIMARY KEY ("id")
);

-- Unique: each user has at most one recap per season
CREATE UNIQUE INDEX "season_recaps_userId_seasonLabel_key"
    ON "season_recaps"("userId", "seasonLabel");

CREATE UNIQUE INDEX "season_recaps_shareToken_key"
    ON "season_recaps"("shareToken");

CREATE INDEX "season_recaps_userId_seasonLabel_idx"
    ON "season_recaps"("userId", "seasonLabel");

ALTER TABLE "season_recaps"
    ADD CONSTRAINT "season_recaps_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
