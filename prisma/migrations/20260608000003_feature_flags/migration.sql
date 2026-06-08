-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 100,
    "userSegment" JSONB NOT NULL DEFAULT '["all"]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_key_idx" ON "feature_flags"("key");

-- Seed: initial A/B test flag for onboarding
INSERT INTO "feature_flags" ("id", "key", "description", "enabled", "rolloutPercentage", "userSegment", "updatedAt")
VALUES (
  gen_random_uuid(),
  'onboarding_ab_v2',
  'A/B test: new onboarding flow with video walkthrough (v2) vs control',
  false,
  50,
  '["all"]',
  NOW()
);
