import { inngest } from "@/inngest/client";
import { checkAndAwardAchievements } from "@/domains/analysis/services/achievementService";
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
    return { awarded };
  }
);
