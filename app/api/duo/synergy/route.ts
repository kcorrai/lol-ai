import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getDuoSynergy } from "@/domains/analysis/services/duoSynergyService";

export const dynamic = "force-dynamic";

const SYNERGY_LIMIT = { limit: 60, windowMs: 3_600_000 };

// GET /api/duo/synergy?riotAccountId= — the duo panel's payload. Null when no duo is marked,
// which the panel renders as its picker rather than as an error.
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const rate = await checkRateLimit(`duo-synergy:${getIp(req)}`, SYNERGY_LIMIT);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs, rate.limit);

  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  return apiSuccess(await getDuoSynergy(riotAccountId));
});
