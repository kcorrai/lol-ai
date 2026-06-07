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

  if (!integration) throw Errors.notFound("Discord integration");

  const webhookUrl = decryptString(integration.webhookUrl);
  await sendDiscordWebhook(webhookUrl, testEmbed());

  return apiSuccess({ ok: true });
});
