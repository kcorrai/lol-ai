import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { getDailyQuest } from "@/domains/analysis/services/dailyQuestService";

export const dynamic = "force-dynamic";

// GET /api/daily-quest — today's quest (in-game leg + on-site leg) and the quest streak
export const GET = withAuth(async (_req, { userId }) => {
  return apiSuccess(await getDailyQuest(userId));
});
