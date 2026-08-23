import { withAuth } from "@/lib/api/withAuth";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getProComparison } from "@/domains/analysis/services/proComparisonService";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/riot/[riotAccountId]/pro-comparison?championId=X
// Returns a per-champion comparison between the player's stats
// and Master+ aggregates from our own match database.
export const GET = withAuth(async (req, { userId }) => {
  const riotAccountId = req.nextUrl.pathname.split("/").at(-2) ?? "";
  if (!riotAccountId) return apiError("BAD_REQUEST", "Missing riotAccountId", 400);

  const championIdParam = req.nextUrl.searchParams.get("championId");
  const championId = championIdParam ? parseInt(championIdParam, 10) : NaN;
  if (isNaN(championId)) return apiError("BAD_REQUEST", "championId query param is required", 400);

  try {
    await assertOwnsRiotAccount(userId, riotAccountId);
  } catch {
    return apiError("FORBIDDEN", "Forbidden", 403);
  }

  const comparison = await getProComparison(riotAccountId, championId);
  if (!comparison) {
    return apiError(
      "NOT_FOUND",
      "Not enough data for comparison (need 20+ Master+ games and 1+ player games for this champion)",
      404
    );
  }

  return apiSuccess(comparison);
});
