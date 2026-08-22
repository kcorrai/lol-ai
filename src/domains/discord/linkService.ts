import { prisma } from "@/lib/db/prisma";

export interface LinkedIdentity {
  userId: string;
  discordUsername: string;
  /** The Riot account commands answer for when no riot-id is given. */
  riotAccount: { gameName: string; tagLine: string; region: string } | null;
}

/**
 * The LoL AI Coach account behind a Discord user, if they have linked one.
 *
 * Picks the primary Riot account, falling back to the oldest connected one so a
 * user who never marked a primary still gets an answer.
 */
export async function getLinkedIdentity(discordUserId: string): Promise<LinkedIdentity | null> {
  const integration = await prisma.discordIntegration.findUnique({
    where: { discordUserId },
    select: {
      userId: true,
      discordUsername: true,
      user: {
        select: {
          riotAccounts: {
            select: { gameName: true, tagLine: true, region: true },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            take: 1,
          },
        },
      },
    },
  });
  if (!integration) return null;

  return {
    userId: integration.userId,
    discordUsername: integration.discordUsername ?? "",
    riotAccount: integration.user.riotAccounts[0] ?? null,
  };
}

export type LinkOutcome = "linked" | "taken";

/**
 * Binds a Discord user to a LoL AI Coach account.
 *
 * `discordUserId` is unique, so a Discord account already claimed by somebody
 * else is reported rather than silently moved — that would be an account
 * takeover by whoever ran the slash command last.
 */
export async function linkDiscordAccount(
  userId: string,
  discordUserId: string,
  discordUsername: string
): Promise<LinkOutcome> {
  const existing = await prisma.discordIntegration.findUnique({
    where: { discordUserId },
    select: { userId: true },
  });
  if (existing && existing.userId !== userId) return "taken";

  await prisma.discordIntegration.upsert({
    where: { userId },
    create: { userId, discordUserId, discordUsername },
    update: { discordUserId, discordUsername },
  });
  return "linked";
}

/**
 * Drops the link, keeping the row when a channel webhook still needs it —
 * unlinking the bot must not silently switch off rank-up notifications.
 */
export async function unlinkDiscordAccount(discordUserId: string): Promise<boolean> {
  const integration = await prisma.discordIntegration.findUnique({
    where: { discordUserId },
    select: { userId: true, webhookUrl: true },
  });
  if (!integration) return false;

  if (integration.webhookUrl) {
    await prisma.discordIntegration.update({
      where: { userId: integration.userId },
      data: { discordUserId: null, discordUsername: null },
    });
  } else {
    await prisma.discordIntegration.delete({ where: { userId: integration.userId } });
  }
  return true;
}
