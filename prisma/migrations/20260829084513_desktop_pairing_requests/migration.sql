-- CreateTable
CREATE TABLE "desktop_pairing_requests" (
    "id" UUID NOT NULL,
    "secretHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "userId" UUID,
    "deviceId" UUID,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "desktop_pairing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "desktop_pairing_requests_secretHash_key" ON "desktop_pairing_requests"("secretHash");

-- CreateIndex
CREATE INDEX "desktop_pairing_requests_userId_createdAt_idx" ON "desktop_pairing_requests"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "desktop_pairing_requests_expiresAt_idx" ON "desktop_pairing_requests"("expiresAt");

-- AddForeignKey
ALTER TABLE "desktop_pairing_requests" ADD CONSTRAINT "desktop_pairing_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
