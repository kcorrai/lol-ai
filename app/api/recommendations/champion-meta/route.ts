import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getMetaRecommendations } from "@/domains/analysis/services/metaRecommendationService";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";

const RECS_LIMIT = { limit: 60, windowMs: 3_600_000 };

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const ip = getIp(req);
  const rateCheck = await checkRateLimit(`champion-meta:${ip}`, RECS_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const recommendations = await getMetaRecommendations(riotAccountId);
  return apiSuccess(recommendations);
});
