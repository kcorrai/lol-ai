-- CreateTable
CREATE TABLE "ai_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_cache_cacheKey_key" ON "ai_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "ai_cache_type_idx" ON "ai_cache"("type");

-- CreateIndex
CREATE INDEX "ai_cache_expiresAt_idx" ON "ai_cache"("expiresAt");
