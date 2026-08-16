import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { checkAndAwardAchievements } from "@/domains/analysis/services/achievementService";
import { ACHIEVEMENT_CATALOG } from "@/types/achievement";
import { sendDiscordWebhook } from "@/lib/discord/webhookService";
import { achievementEmbed } from "@/lib/discord/embeds";
import { decryptString } from "@/lib/crypto/encrypt";
import { logger } from "@/lib/utils/logger";

export const achievementChecker = inngest.createFunction(
  {
    id: "achievement-checker",
    triggers: [{ event: "achievement/check" }],
    retries: 2,
  },
  async ({ event }: { event: { data: { userId: string; riotAccountId: string } } }) => {
    const { userId, riotAccountId } = event.data;
    logger.info(`[achievementChecker] Checking achievements for user ${userId}`);
    const awarded = await checkAndAwardAchievements(userId, riotAccountId);
    logger.info(`[achievementChecker] Awarded ${awarded.length} achievement(s): ${awarded.join(", ")}`);

    if (awarded.length > 0) {
      const discord = await prisma.discordIntegration.findUnique({
        where: { userId },
        select: { webhookUrl: true, notifyBadge: true },
      });

      if (discord?.notifyBadge && discord.webhookUrl) {
        const account = await prisma.riotAccount.findFirst({
          where: { id: riotAccountId },
          select: { gameName: true },
        });
        const gameName = account?.gameName ?? "Player";

        for (const id of awarded) {
          const meta = ACHIEVEMENT_CATALOG.find((a) => a.id === id);
          if (!meta) continue;
          try {
            await sendDiscordWebhook(
              decryptString(discord.webhookUrl),
              achievementEmbed({
                gameName,
                achievementName: meta.name,
                achievementDescription: meta.description,
                tier: meta.tier,
                iconSlug: meta.iconSlug,
              })
            );
          } catch (err) {
            logger.warn(`[achievementChecker] Discord webhook failed: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    }

    return { awarded };
  }
);
