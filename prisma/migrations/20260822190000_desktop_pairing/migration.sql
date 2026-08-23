-- DropIndex
DROP INDEX "idx_bookings_pair_recency";

-- CreateTable
CREATE TABLE "desktop_pairing_codes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "desktop_pairing_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desktop_devices" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "desktop_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "desktop_pairing_codes_codeHash_key" ON "desktop_pairing_codes"("codeHash");

-- CreateIndex
CREATE INDEX "desktop_pairing_codes_userId_createdAt_idx" ON "desktop_pairing_codes"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "desktop_pairing_codes_expiresAt_idx" ON "desktop_pairing_codes"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "desktop_devices_tokenHash_key" ON "desktop_devices"("tokenHash");

-- CreateIndex
CREATE INDEX "desktop_devices_userId_createdAt_idx" ON "desktop_devices"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "desktop_pairing_codes" ADD CONSTRAINT "desktop_pairing_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desktop_devices" ADD CONSTRAINT "desktop_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

