-- The Discord bot's account link lives in the two columns this table has been
-- reserving since it was created (discordUserId, discordUsername), so it needs
-- no new table. What it does need is for the channel webhook to become optional:
-- a row can now exist for an account link with no webhook behind it.
--
-- Safe on existing data — every row today has a webhookUrl, and dropping NOT NULL
-- neither rewrites nor rejects any of them.
ALTER TABLE "discord_integrations" ALTER COLUMN "webhookUrl" DROP NOT NULL;

-- One Discord account cannot be claimed by two LoL AI Coach accounts. Postgres
-- allows any number of NULLs under a unique index, so every row that has never
-- linked stays valid.
CREATE UNIQUE INDEX "discord_integrations_discordUserId_key"
  ON "discord_integrations"("discordUserId");
