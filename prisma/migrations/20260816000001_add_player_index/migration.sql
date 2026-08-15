-- CreateTable
CREATE TABLE "player_index" (
    "puuid" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "searchKey" TEXT NOT NULL,
    "profileIconId" INTEGER,
    "summonerLevel" INTEGER,
    "seenCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_index_pkey" PRIMARY KEY ("puuid")
);

-- CreateIndex
-- text_pattern_ops, not the default collation: it is what lets `searchKey LIKE 'fak%'` use the
-- index instead of scanning the table. Without it autocomplete degrades as the index grows.
CREATE INDEX "player_index_searchKey_idx" ON "player_index"("searchKey" text_pattern_ops);

-- CreateIndex
CREATE INDEX "player_index_region_searchKey_idx" ON "player_index"("region", "searchKey" text_pattern_ops);
