import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { encryptString } from "@/lib/crypto/encrypt";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/settings/discord — returns current Discord integration (webhook URL masked)
export const GET = withAuth(async (_req, { userId }) => {
  const integration = await prisma.discordIntegration.findUnique({
    where: { userId },
    select: {
      discordUsername: true,
      webhookUrl: true,
      notifyRankUp: true,
      notifyBadge: true,
      notifyWeekly: true,
    },
  });

  if (!integration) return apiSuccess(null);

  return apiSuccess({
    ...integration,
    webhookUrl: integration.webhookUrl ? "••••••••" : null,
    hasWebhook: !!integration.webhookUrl,
  });
});

// POST /api/settings/discord — save webhook URL + notification preferences
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw Errors.validation("Invalid JSON body");
  }

  if (typeof body !== "object" || body === null) throw Errors.validation("Invalid body");
  const b = body as Record<string, unknown>;

  if (typeof b.webhookUrl !== "string" || !b.webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    throw Errors.validation("webhookUrl must be a valid Discord webhook URL");
  }

  let encrypted: string;
  try {
    encrypted = encryptString(b.webhookUrl);
  } catch {
    throw Errors.validation(
      "Discord integration is currently unavailable. Administrator must set the AUTH_ENCRYPTION_KEY environment variable."
    );
  }

  await prisma.discordIntegration.upsert({
    where: { userId },
    create: {
      userId,
      webhookUrl: encrypted,
      notifyRankUp: typeof b.notifyRankUp === "boolean" ? b.notifyRankUp : true,
      notifyBadge: typeof b.notifyBadge === "boolean" ? b.notifyBadge : false,
      notifyWeekly: typeof b.notifyWeekly === "boolean" ? b.notifyWeekly : true,
    },
    update: {
      webhookUrl: encrypted,
      notifyRankUp: typeof b.notifyRankUp === "boolean" ? b.notifyRankUp : undefined,
      notifyBadge: typeof b.notifyBadge === "boolean" ? b.notifyBadge : undefined,
      notifyWeekly: typeof b.notifyWeekly === "boolean" ? b.notifyWeekly : undefined,
    },
  });

  return apiSuccess({ ok: true });
});

// DELETE /api/settings/discord — remove the channel webhook
export const DELETE = withAuth(async (_req, { userId }) => {
  const integration = await prisma.discordIntegration.findUnique({
    where: { userId },
    select: { discordUserId: true },
  });
  if (!integration) return apiSuccess({ ok: true });

  // The same row also holds the bot's account link. Deleting it outright would
  // silently unlink the bot from a page that says nothing about the bot, so the
  // webhook is cleared and the row survives whenever a link is on it.
  if (integration.discordUserId) {
    await prisma.discordIntegration.update({
      where: { userId },
      data: { webhookUrl: null },
    });
  } else {
    await prisma.discordIntegration.delete({ where: { userId } });
  }

  return apiSuccess({ ok: true });
});
