-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'pro', 'elite');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- CreateEnum
CREATE TYPE "QueueType" AS ENUM ('RANKED_SOLO_5x5', 'RANKED_FLEX_SR', 'NORMAL_BLIND', 'NORMAL_DRAFT', 'ARAM', 'ARENA', 'URF', 'ONE_FOR_ALL', 'NEXUS_BLITZ');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY');

-- CreateEnum
CREATE TYPE "RankTier" AS ENUM ('IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER');

-- CreateEnum
CREATE TYPE "RankDivision" AS ENUM ('I', 'II', 'III', 'IV');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('session_review', 'champion_focus', 'climb_roadmap');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'processing', 'complete', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "preferredRole" "Position",
    "coachingStyle" TEXT NOT NULL DEFAULT 'balanced',
    "rankGoal" TEXT,
    "weeklyPlayHours" INTEGER,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lsCustomerId" TEXT,
    "lsSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'free',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riot_accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "puuid" TEXT NOT NULL,
    "summonerId" TEXT,
    "accountId" TEXT,
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "summonerLevel" INTEGER NOT NULL,
    "profileIconId" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riot_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "matchId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "queueId" INTEGER NOT NULL,
    "queueType" "QueueType" NOT NULL,
    "gameMode" TEXT NOT NULL,
    "gameDuration" INTEGER NOT NULL,
    "gameStart" TIMESTAMP(3) NOT NULL,
    "gameEnd" TIMESTAMP(3) NOT NULL,
    "gameVersion" TEXT NOT NULL,
    "winningTeam" INTEGER NOT NULL,
    "rawDataHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_participants" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "riotAccountId" UUID,
    "puuid" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "championId" INTEGER NOT NULL,
    "championName" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "kills" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "cs" INTEGER NOT NULL,
    "csPerMinute" DECIMAL(5,2) NOT NULL,
    "goldEarned" INTEGER NOT NULL,
    "goldPerMinute" DECIMAL(7,2) NOT NULL,
    "damageDealt" INTEGER NOT NULL,
    "damageTaken" INTEGER NOT NULL,
    "damageHealed" INTEGER NOT NULL,
    "visionScore" INTEGER NOT NULL,
    "wardsPlaced" INTEGER NOT NULL,
    "wardsKilled" INTEGER NOT NULL,
    "controlWardsBought" INTEGER NOT NULL,
    "turretsDestroyed" INTEGER NOT NULL,
    "objectivesStolen" INTEGER NOT NULL,
    "firstBlood" BOOLEAN NOT NULL,
    "won" BOOLEAN NOT NULL,
    "timeSpentDead" INTEGER NOT NULL,
    "totalTimeCCDealt" INTEGER NOT NULL,
    "itemIds" INTEGER[],
    "runePrimaryPath" INTEGER,
    "runePrimaryKeystone" INTEGER,
    "runeSecondaryPath" INTEGER,
    "summonerSpell1" INTEGER NOT NULL,
    "summonerSpell2" INTEGER NOT NULL,

    CONSTRAINT "match_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "champions" (
    "id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roles" TEXT[],
    "difficulty" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "patchVersion" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "champions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "champion_stats" (
    "id" UUID NOT NULL,
    "riotAccountId" UUID NOT NULL,
    "championId" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "avgKda" DECIMAL(5,2) NOT NULL,
    "avgKills" DECIMAL(4,2) NOT NULL,
    "avgDeaths" DECIMAL(4,2) NOT NULL,
    "avgAssists" DECIMAL(4,2) NOT NULL,
    "avgCs" DECIMAL(6,2) NOT NULL,
    "avgCsPerMinute" DECIMAL(5,2) NOT NULL,
    "avgVisionScore" DECIMAL(5,2) NOT NULL,
    "avgDamageDealt" DECIMAL(10,2) NOT NULL,
    "avgGoldPerMin" DECIMAL(7,2) NOT NULL,
    "masteryLevel" INTEGER,
    "masteryPoints" BIGINT,
    "queueType" "QueueType" NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "champion_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranked_history" (
    "id" UUID NOT NULL,
    "riotAccountId" UUID NOT NULL,
    "queueType" "QueueType" NOT NULL,
    "tier" "RankTier" NOT NULL,
    "division" "RankDivision" NOT NULL,
    "lp" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "hotStreak" BOOLEAN NOT NULL DEFAULT false,
    "inactive" BOOLEAN NOT NULL DEFAULT false,
    "recordedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranked_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_snapshots" (
    "id" UUID NOT NULL,
    "riotAccountId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "gamesAnalyzed" INTEGER NOT NULL,
    "winRate" DECIMAL(5,2) NOT NULL,
    "avgKda" DECIMAL(5,2) NOT NULL,
    "avgCsPerMinute" DECIMAL(5,2) NOT NULL,
    "avgVisionScore" DECIMAL(5,2) NOT NULL,
    "tiltScore" DECIMAL(5,2),
    "mostPlayedChampionIds" INTEGER[],
    "strongestArea" TEXT,
    "weakestArea" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_reports" (
    "id" UUID NOT NULL,
    "riotAccountId" UUID NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "matchesAnalyzed" TEXT[],
    "summary" TEXT,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "actionItems" JSONB,
    "championRecommendations" JSONB,
    "estimatedRankPotential" TEXT,
    "coachPersonaResponse" TEXT,
    "userRating" INTEGER,
    "userFeedback" TEXT,
    "aiModelUsed" TEXT,
    "processingTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "coaching_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" UUID NOT NULL,
    "coachingReportId" UUID,
    "analysisType" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "costUsd" DECIMAL(10,6),
    "responseRaw" TEXT NOT NULL,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "eventKey" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_lsCustomerId_key" ON "subscriptions"("lsCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_lsSubscriptionId_key" ON "subscriptions"("lsSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_lsCustomerId_idx" ON "subscriptions"("lsCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "riot_accounts_puuid_key" ON "riot_accounts"("puuid");

-- CreateIndex
CREATE INDEX "riot_accounts_userId_idx" ON "riot_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_matchId_key" ON "matches"("matchId");

-- CreateIndex
CREATE INDEX "matches_gameStart_idx" ON "matches"("gameStart");

-- CreateIndex
CREATE INDEX "matches_queueType_gameStart_idx" ON "matches"("queueType", "gameStart");

-- CreateIndex
CREATE INDEX "match_participants_matchId_idx" ON "match_participants"("matchId");

-- CreateIndex
CREATE INDEX "match_participants_riotAccountId_matchId_idx" ON "match_participants"("riotAccountId", "matchId");

-- CreateIndex
CREATE INDEX "match_participants_riotAccountId_championId_idx" ON "match_participants"("riotAccountId", "championId");

-- CreateIndex
CREATE UNIQUE INDEX "champions_key_key" ON "champions"("key");

-- CreateIndex
CREATE INDEX "champion_stats_riotAccountId_gamesPlayed_idx" ON "champion_stats"("riotAccountId", "gamesPlayed" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "champion_stats_riotAccountId_championId_queueType_key" ON "champion_stats"("riotAccountId", "championId", "queueType");

-- CreateIndex
CREATE INDEX "ranked_history_riotAccountId_queueType_recordedAt_idx" ON "ranked_history"("riotAccountId", "queueType", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "performance_snapshots_riotAccountId_periodEnd_idx" ON "performance_snapshots"("riotAccountId", "periodEnd" DESC);

-- CreateIndex
CREATE INDEX "coaching_reports_riotAccountId_createdAt_idx" ON "coaching_reports"("riotAccountId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "coaching_reports_status_idx" ON "coaching_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_analyses_inputHash_key" ON "ai_analyses"("inputHash");

-- CreateIndex
CREATE INDEX "ai_analyses_coachingReportId_idx" ON "ai_analyses"("coachingReportId");

-- CreateIndex
CREATE INDEX "ai_analyses_createdAt_idx" ON "ai_analyses"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_eventKey_key" ON "webhook_events"("eventKey");

-- CreateIndex
CREATE INDEX "webhook_events_processedAt_idx" ON "webhook_events"("processedAt" DESC);

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riot_accounts" ADD CONSTRAINT "riot_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "champion_stats" ADD CONSTRAINT "champion_stats_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "champion_stats" ADD CONSTRAINT "champion_stats_championId_fkey" FOREIGN KEY ("championId") REFERENCES "champions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranked_history" ADD CONSTRAINT "ranked_history_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_snapshots" ADD CONSTRAINT "performance_snapshots_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_reports" ADD CONSTRAINT "coaching_reports_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_coachingReportId_fkey" FOREIGN KEY ("coachingReportId") REFERENCES "coaching_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

