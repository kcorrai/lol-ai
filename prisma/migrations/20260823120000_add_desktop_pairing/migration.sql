-- Desktop companion pairing (ADR-038).
--
-- Two new tables, no change to anything that exists — nothing here rewrites a
-- row, drops a column or touches an existing index, so it is safe to apply to a
-- populated database at any time.

-- A machine paired with an account. "token" is a capability, the same shape as
-- creator_profiles.overlayKey: the desktop app cannot carry a session cookie, so
-- the token is the whole of its identity.
CREATE TABLE "desktop_devices" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "desktop_devices_pkey" PRIMARY KEY ("id")
);

-- A one-time code the player reads off the website and types into the app. A row
-- rather than a signed token, for the one thing a stateless token cannot give:
-- single use.
CREATE TABLE "desktop_pairing_codes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "deviceId" UUID,

    CONSTRAINT "desktop_pairing_codes_pkey" PRIMARY KEY ("id")
);

-- The lookup every pairing request makes, and the guarantee that a token or a
-- code is never handed out twice.
CREATE UNIQUE INDEX "desktop_devices_token_key" ON "desktop_devices"("token");
CREATE UNIQUE INDEX "desktop_pairing_codes_code_key" ON "desktop_pairing_codes"("code");

-- The device list and the code history, both newest first.
CREATE INDEX "desktop_devices_userId_createdAt_idx" ON "desktop_devices"("userId", "createdAt" DESC);
CREATE INDEX "desktop_pairing_codes_userId_createdAt_idx" ON "desktop_pairing_codes"("userId", "createdAt" DESC);

-- Sweeping expired codes, and what keeps that table from growing without bound.
CREATE INDEX "desktop_pairing_codes_expiresAt_idx" ON "desktop_pairing_codes"("expiresAt");

ALTER TABLE "desktop_devices"
    ADD CONSTRAINT "desktop_devices_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "desktop_pairing_codes"
    ADD CONSTRAINT "desktop_pairing_codes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
