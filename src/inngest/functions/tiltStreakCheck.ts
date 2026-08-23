import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import { generateTiltRecoveryMessage } from "@/domains/analysis/services/tiltService";
import { logger } from "@/lib/utils/logger";
import { sendPushToUser } from "@/lib/push/pushService";

export interface TiltCheckPayload {
  riotAccountId: string;
  userId: string;
}

const COOLDOWN_HOURS = 12;
const MAX_ALERTS_PER_DAY = 2;

export const tiltStreakCheck = inngest.createFunction(
  {
    id: "tilt-streak-check",
    triggers: [{ event: "tilt/check-streak" }],
    retries: 1,
  },
  async ({ event }) => {
    const { riotAccountId, userId } = event.data as TiltCheckPayload;
    const puuid = await getAccountPuuid(riotAccountId);

    const recentMatches = await prisma.matchParticipant.findMany({
      where: { puuid: puuid ?? "" },
      orderBy: { match: { gameStart: "desc" } },
      take: 5,
      select: {
        won: true,
        kills: true,
        deaths: true,
        assists: true,
        championName: true,
      },
    });

    if (recentMatches.length < 3) return { skipped: "insufficient_data" };

    const lastThree = recentMatches.slice(0, 3);
    const isLoseStreak = lastThree.every((m) => !m.won);
    if (!isLoseStreak) return { skipped: "no_streak" };

    // Spam guard: no alert if one was sent within the cooldown window
    const cutoff = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000);
    const recentAlert = await prisma.tiltAlert.findFirst({
      where: { userId, createdAt: { gte: cutoff } },
    });
    if (recentAlert) return { skipped: "cooldown" };

    // Daily cap
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.tiltAlert.count({
      where: { userId, createdAt: { gte: dayStart } },
    });
    if (todayCount >= MAX_ALERTS_PER_DAY) return { skipped: "daily_cap" };

    const snippets = recentMatches.slice(0, 3).map((m) => ({
      championName: m.championName ?? "Unknown",
      won: m.won ?? false,
      kills: m.kills ?? 0,
      deaths: m.deaths ?? 0,
      assists: m.assists ?? 0,
    }));

    let message: string;
    try {
      message = await generateTiltRecoveryMessage(snippets);
    } catch (err) {
      logger.warn(
        `[tiltStreakCheck] AI message failed: ${err instanceof Error ? err.message : String(err)}`
      );
      message =
        "Taking a break after 3 consecutive losses statistically improves your win rate. Take 15-20 minutes to cool off, then play again.";
    }

    await prisma.tiltAlert.create({
      data: { userId, riotAccountId, message, streakLength: 3 },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
    await sendPushToUser(userId, {
      title: "Tilt Alert — Take a Break!",
      body: message.slice(0, 100),
      url: `${appUrl}/dashboard`,
      tag: `tilt-${userId}`,
    }).catch(() => {
      /* non-blocking */
    });

    logger.info(`[tiltStreakCheck] Alert created for userId=${userId.slice(0, 8)}…`);
    return { sent: true, streakLength: 3 };
  }
);
