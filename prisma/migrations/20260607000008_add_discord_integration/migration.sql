-- CreateTable discord_integrations
CREATE TABLE "discord_integrations" (
    "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId"          UUID NOT NULL,
    "discordUserId"   TEXT,
    "discordUsername" TEXT,
    "webhookUrl"      TEXT NOT NULL,
    "notifyRankUp"    BOOLEAN NOT NULL DEFAULT true,
    "notifyBadge"     BOOLEAN NOT NULL DEFAULT false,
    "notifyWeekly"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "discord_integrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "discord_integrations_userId_key" ON "discord_integrations"("userId");

ALTER TABLE "discord_integrations" ADD CONSTRAINT "discord_integrations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
