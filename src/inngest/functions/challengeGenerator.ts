import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { generateDailyChallenge, generateWeeklyChallenge } from "@/domains/analysis/services/challengeService";
import { logger } from "@/lib/utils/logger";

// Fires every day at 00:00 UTC — generates a daily challenge for each active user.
export const dailyChallengeGenerator = inngest.createFunction(
  { id: "daily-challenge-generator", triggers: [{ cron: "0 0 * * *" }], retries: 1 },
  async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const users = await prisma.user.findMany({
      where: { updatedAt: { gte: sevenDaysAgo } },
      select: { id: true, riotAccounts: { where: { isPrimary: true }, select: { id: true }, take: 1 } },
    });

    let generated = 0;
    for (const user of users) {
      const account = user.riotAccounts[0];
      if (!account) continue;
      try {
        await generateDailyChallenge(user.id, account.id);
        generated++;
      } catch (err) {
        logger.warn(`[challengeGenerator] Failed for user ${user.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    logger.info(`[challengeGenerator] Daily challenges generated: ${generated}/${users.length}`);
    return { generated };
  }
);

// Fires every Monday at 00:00 UTC — generates a weekly challenge for Pro/Elite users.
export const weeklyChallengeGenerator = inngest.createFunction(
  { id: "weekly-challenge-generator", triggers: [{ cron: "0 0 * * 1" }], retries: 1 },
  async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const users = await prisma.user.findMany({
      where: {
        updatedAt: { gte: sevenDaysAgo },
        subscription: { plan: { in: ["pro", "elite", "team"] } },
      },
      select: { id: true, riotAccounts: { where: { isPrimary: true }, select: { id: true }, take: 1 } },
    });

    let generated = 0;
    for (const user of users) {
      const account = user.riotAccounts[0];
      if (!account) continue;
      try {
        await generateWeeklyChallenge(user.id, account.id);
        generated++;
      } catch (err) {
        logger.warn(`[weeklyChallengeGenerator] Failed for user ${user.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    logger.info(`[weeklyChallengeGenerator] Weekly challenges generated: ${generated}/${users.length}`);
    return { generated };
  }
);
