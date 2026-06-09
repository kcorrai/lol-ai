import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { getActiveChallenges, getActiveChallengeStreak, getUserXpLevel } from "@/domains/analysis/services/challengeProgressService";

export const dynamic = "force-dynamic";

// GET /api/challenges — returns active challenges + XP/level + streak for the authenticated user
export const GET = withAuth(async (_req, { userId }) => {
  const [challenges, xpLevel, streak] = await Promise.all([
    getActiveChallenges(userId),
    getUserXpLevel(userId),
    getActiveChallengeStreak(userId),
  ]);

  return apiSuccess({ challenges, ...xpLevel, streak });
});
