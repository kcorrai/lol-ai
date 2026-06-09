import { inngest } from "@/inngest/client";
import { checkAndUpdateChallengeProgress, getActiveChallengeStreak } from "@/domains/analysis/services/challengeProgressService";
import { logger } from "@/lib/utils/logger";

// Triggered after every match sync to update challenge progress.
export const challengeProgressChecker = inngest.createFunction(
  { id: "challenge-progress-checker", triggers: [{ event: "challenge/check-progress" }], retries: 2 },
  async ({ event }: { event: { data: { userId: string; riotAccountId: string } } }) => {
    const { userId, riotAccountId } = event.data;

    await checkAndUpdateChallengeProgress(userId, riotAccountId);

    const streak = await getActiveChallengeStreak(userId);
    if (streak >= 7) {
      await inngest.send({
        name: "achievement/check",
        data: { userId, riotAccountId },
      });
      logger.info(`[challengeProgress] 7-day streak for user ${userId} — achievement check triggered`);
    }

    return { userId, streak };
  }
);
