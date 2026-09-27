import { prisma } from "@/lib/db/prisma";
import { sendDirectMessage } from "@/lib/discord/directMessage";

/**
 * DM a LaneIQ user through the bot, if they have linked Discord with it.
 *
 * Only users who ran the bot's link command have a `discordUserId`; everyone
 * else is skipped without a sound, as is every user when the bot token is not
 * configured (local development, a deployment without the bot).
 */
export async function messageLinkedUser(userId: string, content: string): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return false;

  const link = await prisma.discordIntegration.findUnique({
    where: { userId },
    select: { discordUserId: true },
  });
  if (!link?.discordUserId) return false;

  return sendDirectMessage(link.discordUserId, content, token);
}
