import { withAuth } from "@/lib/api/withAuth";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getTeamfightAnalysis } from "@/domains/analysis/services/teamfightService";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/riot/[riotAccountId]/teamfight?matchCount=10
export const GET = withAuth(async (req, { userId }) => {
  const riotAccountId = req.nextUrl.pathname.split("/").at(-2) ?? "";
  if (!riotAccountId) return apiError("BAD_REQUEST", "Missing riotAccountId", 400);

  try {
    await assertOwnsRiotAccount(userId, riotAccountId);
  } catch {
    return apiError("FORBIDDEN", "Forbidden", 403);
  }

  const countParam = req.nextUrl.searchParams.get("matchCount");
  const matchCount = countParam ? Math.min(parseInt(countParam, 10), 30) : 10;

  const analysis = await getTeamfightAnalysis(riotAccountId, matchCount);
  return apiSuccess(analysis);
});
