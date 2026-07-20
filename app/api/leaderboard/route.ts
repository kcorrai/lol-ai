import { type NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getLeaderboard } from "@/domains/analysis/services/leaderboardService";

// Note: reading `searchParams` below forces dynamic rendering, so this declaration does not
// actually cache anything — every request reaches the database. Hence the rate limit.
export const revalidate = 300; // 5 min cache

const LEADERBOARD_LIMIT = { limit: 60, windowMs: 60_000 };

export async function GET(req: NextRequest): Promise<Response> {
  const rl = await checkRateLimit(`leaderboard:${getIp(req)}`, LEADERBOARD_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const period = (req.nextUrl.searchParams.get("period") ?? "week") as "week" | "month";
  const data = await getLeaderboard(period);
  return apiSuccess(data);
}
