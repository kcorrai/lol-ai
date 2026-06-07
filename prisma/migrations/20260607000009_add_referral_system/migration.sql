-- AlterTable: add proTrialEndsAt to users
ALTER TABLE "users" ADD COLUMN "proTrialEndsAt" TIMESTAMP(3);

-- CreateTable: referrals
CREATE TABLE "referrals" (
    "id"          TEXT NOT NULL,
    "referrerId"  UUID NOT NULL,
    "refereeId"   UUID,
    "code"        TEXT NOT NULL,
    "status"      TEXT NOT NULL DEFAULT 'pending',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referrals_refereeId_key" ON "referrals"("refereeId");
CREATE UNIQUE INDEX "referrals_code_key" ON "referrals"("code");

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_fkey"
  FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_refereeId_fkey"
  FOREIGN KEY ("refereeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
