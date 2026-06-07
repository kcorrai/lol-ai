-- CreateTable
CREATE TABLE "tilt_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "riotAccountId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "streakLength" INTEGER NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tilt_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tilt_alerts_userId_acknowledged_idx" ON "tilt_alerts"("userId", "acknowledged");

-- AddForeignKey
ALTER TABLE "tilt_alerts" ADD CONSTRAINT "tilt_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
