import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount, getPlanLimits } from "@/lib/auth/authorization";
import { getActiveHabits } from "@/domains/analysis/services/habitDetectionService";

// GET /api/analysis/habits?riotAccountId=<uuid>
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const habits = await getActiveHabits(riotAccountId);

  // Free tier: show only the highest-severity habit
  const limits = await getPlanLimits(userId);
  const isPro = limits.matchupAnalysisPerDay === -1;

  const result = isPro ? habits : habits.slice(0, 1);

  return apiSuccess({ habits: result, total: habits.length });
});
