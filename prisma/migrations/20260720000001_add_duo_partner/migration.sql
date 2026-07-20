-- CreateTable
CREATE TABLE "duo_partners" (
    "id" UUID NOT NULL,
    "riotAccountId" UUID NOT NULL,
    "puuid" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duo_partners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "duo_partners_riotAccountId_puuid_key" ON "duo_partners"("riotAccountId", "puuid");

-- CreateIndex
CREATE INDEX "duo_partners_riotAccountId_isActive_idx" ON "duo_partners"("riotAccountId", "isActive");

-- AddForeignKey
ALTER TABLE "duo_partners" ADD CONSTRAINT "duo_partners_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
