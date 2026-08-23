import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount, getPlanLimits } from "@/lib/auth/authorization";
import { getChampionPool } from "@/domains/champions/services/championStatsService";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";

const CHAMPIONS_LIMIT = { limit: 60, windowMs: 3_600_000 };

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const ip = getIp(req);
  const rateCheck = await checkRateLimit(`champions:${ip}`, CHAMPIONS_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const rawMin = req.nextUrl.searchParams.get("minGames");
  const minGames = rawMin ? Math.max(1, Math.min(Number(rawMin), 20)) : 3;

  const pool = await getChampionPool(riotAccountId, minGames);

  // Hard server-side limit — prevents UI bypass via direct API calls
  const limits = await getPlanLimits(userId);
  const result = limits.championPoolLimit === -1 ? pool : pool.slice(0, limits.championPoolLimit);

  return apiSuccess(result);
});
