-- AddColumn User.xp / User.level
ALTER TABLE "users" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;

-- CreateTable challenges
CREATE TABLE "challenges" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId"      UUID NOT NULL,
    "type"        TEXT NOT NULL,
    "metric"      TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward"    INTEGER NOT NULL,
    "validFrom"   TIMESTAMP(3) NOT NULL,
    "validUntil"  TIMESTAMP(3) NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "challenges_userId_type_validFrom_idx" ON "challenges"("userId", "type", "validFrom");

ALTER TABLE "challenges" ADD CONSTRAINT "challenges_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable user_challenges
CREATE TABLE "user_challenges" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId"      UUID NOT NULL,
    "challengeId" UUID NOT NULL,
    "progress"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed"   BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_challenges_userId_challengeId_key" ON "user_challenges"("userId", "challengeId");

ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_challengeId_fkey"
    FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
