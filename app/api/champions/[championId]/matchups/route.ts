import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount, getPlanLimits } from "@/lib/auth/authorization";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getPersonalMatchups } from "@/domains/counter";

const RATE_LIMIT = { limit: 30, windowMs: 3_600_000 };

// GET /api/champions/[championId]/matchups?riotAccountId=<uuid>
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const ip = getIp(req);
  const rateCheck = await checkRateLimit(`matchups:${ip}`, RATE_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  // pathname = /api/champions/<id>/matchups → segments[-2] = championId
  const segments = req.nextUrl.pathname.split("/");
  const rawId = segments.at(-2) ?? "";
  const championId = parseInt(rawId, 10);
  if (isNaN(championId)) throw Errors.validation("Invalid championId");

  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const report = await getPersonalMatchups(riotAccountId, championId);

  if (report.totalMatchupsAnalyzed === 0) {
    throw Errors.validation(
      "Not enough ranked games on this champion to compute matchup data. Play at least 3 ranked games."
    );
  }

  // Free tier: cap best/worst to 3 entries each
  const limits = await getPlanLimits(userId);
  const isPro = limits.matchupAnalysisPerDay === -1;

  const result = isPro
    ? report
    : { ...report, best: report.best.slice(0, 3), worst: report.worst.slice(0, 3) };

  return apiSuccess(result);
});
