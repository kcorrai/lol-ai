-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('IDLE', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "riot_accounts"
  ADD COLUMN "syncStatus"      "SyncStatus" NOT NULL DEFAULT 'IDLE',
  ADD COLUMN "syncStartedAt"   TIMESTAMP(3),
  ADD COLUMN "syncCompletedAt" TIMESTAMP(3),
  ADD COLUMN "lastSyncError"   TEXT;
