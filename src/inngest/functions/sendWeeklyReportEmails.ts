import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { sendWeeklyReports } from "@/domains/coaching/services/weeklyReportService";
import { sendDiscordWebhook } from "@/lib/discord/webhookService";
import { weeklyRecapEmbed } from "@/lib/discord/embeds";
import { decryptString } from "@/lib/crypto/encrypt";
import { logger } from "@/lib/utils/logger";

// Fires every Monday at 09:00 UTC.
// The service layer handles idempotency (one email per user per ISO week)
// so safe retries won't double-send.
export const sendWeeklyReportEmails = inngest.createFunction(
  {
    id: "send-weekly-report-emails",
    triggers: [{ cron: "0 9 * * 1" }],
    retries: 2,
  },
  async () => {
    logger.info("[weekly-report] cron triggered");
    const result = await sendWeeklyReports();
    logger.info("[weekly-report] cron done", result);

    // Send Discord weekly recap to users who opted in
    await sendDiscordWeeklySummaries();

    return result;
  }
);

async function sendDiscordWeeklySummaries(): Promise<void> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const integrations = await prisma.discordIntegration.findMany({
    where: { notifyWeekly: true },
    select: {
      webhookUrl: true,
      user: {
        select: {
          riotAccounts: {
            where: { isPrimary: true },
            select: {
              id: true,
              gameName: true,
              matchParticipants: {
                where: { match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: weekAgo } } },
                select: { won: true },
              },
              rankedHistory: {
                orderBy: { recordedAt: "desc" },
                take: 1,
                select: { tier: true, division: true, lp: true },
              },
              championStats: {
                orderBy: { gamesPlayed: "desc" },
                take: 1,
                include: { champion: { select: { name: true } } },
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  for (const integration of integrations) {
    const account = integration.user.riotAccounts[0];
    if (!account || account.matchParticipants.length === 0) continue;

    const wins = account.matchParticipants.filter((p) => p.won).length;
    const losses = account.matchParticipants.length - wins;
    const topChampion = account.championStats[0]?.champion.name;

    // LP delta — compare current with week-ago snapshot (best effort)
    const currentLp = account.rankedHistory[0];
    const weekAgoRank = await prisma.rankedHistory.findFirst({
      where: { riotAccountId: account.id, queueType: "RANKED_SOLO_5x5", recordedAt: { lte: weekAgo } },
      orderBy: { recordedAt: "desc" },
      select: { tier: true, division: true, lp: true },
    });

    const TIER_ORDER: Record<string, number> = {
      IRON: 0, BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4,
      EMERALD: 5, DIAMOND: 6, MASTER: 7, GRANDMASTER: 8, CHALLENGER: 9,
    };
    const DIV_ORDER: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };
    const composite = (t: string, d: string, lp: number) =>
      (TIER_ORDER[t] ?? 0) * 400 + (DIV_ORDER[d] ?? 0) * 100 + lp;

    const lpDelta =
      currentLp && weekAgoRank
        ? composite(currentLp.tier, currentLp.division, currentLp.lp) -
          composite(weekAgoRank.tier, weekAgoRank.division, weekAgoRank.lp)
        : 0;

    try {
      await sendDiscordWebhook(
        decryptString(integration.webhookUrl),
        weeklyRecapEmbed({ gameName: account.gameName, wins, losses, lpDelta, topChampion })
      );
    } catch (err) {
      logger.warn(`[weekly-report] Discord webhook failed for account ${account.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
