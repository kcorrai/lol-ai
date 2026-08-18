-- LA-25 / ADR-026. The one table the Streamer Kit owns.
--
-- Hand-written, for the same reason 20260817095039_add_followed_teams was:
-- schema.prisma has drifted from the migration history (LA-15), so
-- `prisma migrate dev` attaches thirty-odd unrelated statements — dropping
-- indexes and a column — to any migration it generates. That drift is real and
-- predates this work. None of it belongs in a migration that adds one table.

-- CreateTable
CREATE TABLE "creator_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "riotAccountId" UUID,
    "overlayKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayName" TEXT,
    "streamSafe" BOOLEAN NOT NULL DEFAULT false,
    "delaySeconds" INTEGER NOT NULL DEFAULT 0,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "accentColor" TEXT NOT NULL DEFAULT '#22d3ee',
    "sessionStartedAt" TIMESTAMP(3),
    "goalTier" "RankTier",
    "goalDivision" "RankDivision",
    "twitchHandle" TEXT,
    "kickHandle" TEXT,
    "youtubeHandle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_userId_key" ON "creator_profiles"("userId");

-- CreateIndex
-- Every overlay poll and every chat command looks the row up by this key, so it
-- carries the read path as well as the uniqueness guarantee.
CREATE UNIQUE INDEX "creator_profiles_overlayKey_key" ON "creator_profiles"("overlayKey");

-- CreateIndex
CREATE INDEX "creator_profiles_riotAccountId_idx" ON "creator_profiles"("riotAccountId");

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
-- SetNull, not Cascade: unlinking the Riot account an overlay reads must not
-- delete the kit. The overlay falls back to the primary account.
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
