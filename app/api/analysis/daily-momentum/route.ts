import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import {
  getDailyMomentum,
  DEFAULT_WINDOW_DAYS,
} from "@/domains/analysis/services/dailyMomentumService";

const MOMENTUM_LIMIT = { limit: 60, windowMs: 3_600_000 };

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const rate = await checkRateLimit(`daily-momentum:${getIp(req)}`, MOMENTUM_LIMIT);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs, rate.limit);

  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const days = Number(req.nextUrl.searchParams.get("days")) || DEFAULT_WINDOW_DAYS;
  return apiSuccess(await getDailyMomentum(riotAccountId, days));
});
