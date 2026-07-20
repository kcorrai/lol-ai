import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getDuoCandidates } from "@/domains/analysis/services/duoService";

const CANDIDATES_LIMIT = { limit: 30, windowMs: 3_600_000 };

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const rate = await checkRateLimit(`duo-candidates:${getIp(req)}`, CANDIDATES_LIMIT);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs, rate.limit);

  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  return apiSuccess(await getDuoCandidates(riotAccountId));
});
