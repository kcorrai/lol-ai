import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { decryptString } from "@/lib/crypto/encrypt";
import { sendDiscordWebhook } from "@/lib/discord/webhookService";
import { testEmbed } from "@/lib/discord/embeds";

export const dynamic = "force-dynamic";

// POST /api/settings/discord/test — send a test webhook message
export const POST = withAuth(async (_req, { userId }) => {
  const integration = await prisma.discordIntegration.findUnique({
    where: { userId },
    select: { webhookUrl: true },
  });

  // The row may exist for a Discord account link alone — a test message still
  // needs a channel webhook to send to.
  if (!integration?.webhookUrl) throw Errors.notFound("Discord webhook");

  // The webhook is optional on the integration row: an account can be linked for slash
  // commands with no channel webhook set, and then there is nothing to post a test to.
  if (!integration.webhookUrl) {
    throw Errors.validation("No Discord webhook is configured for this account.");
  }

  let webhookUrl: string;
  try {
    webhookUrl = decryptString(integration.webhookUrl);
  } catch {
    throw Errors.validation(
      "Discord integration is currently unavailable. The AUTH_ENCRYPTION_KEY environment variable is not set."
    );
  }
  await sendDiscordWebhook(webhookUrl, testEmbed());

  return apiSuccess({ ok: true });
});
