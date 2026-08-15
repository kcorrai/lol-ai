-- CreateTable
CREATE TABLE "duo_quests" (
    "id" UUID NOT NULL,
    "riotAccountId" UUID NOT NULL,
    "partnerPuuid" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "xpReward" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duo_quests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- One row per pair per quest per week. Generation is a read-time upsert, so this is what stops a
-- second page load creating a duplicate or paying the XP twice.
CREATE UNIQUE INDEX "duo_quests_riotAccountId_partnerPuuid_key_periodStart_key" ON "duo_quests"("riotAccountId", "partnerPuuid", "key", "periodStart");

-- CreateIndex
CREATE INDEX "duo_quests_riotAccountId_periodStart_idx" ON "duo_quests"("riotAccountId", "periodStart");

-- AddForeignKey
ALTER TABLE "duo_quests" ADD CONSTRAINT "duo_quests_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
