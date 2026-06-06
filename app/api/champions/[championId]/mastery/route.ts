import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getChampionMastery } from "@/domains/champions/services/masteryScoreService";

const RATE_LIMIT = { limit: 60, windowMs: 3_600_000 };

// GET /api/champions/[championId]/mastery?riotAccountId=<uuid>
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const ip = getIp(req);
  const rateCheck = await checkRateLimit(`mastery:${ip}`, RATE_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  // pathname = /api/champions/<id>/mastery → segments[-2] = championId
  const segments = req.nextUrl.pathname.split("/");
  const rawId = segments.at(-2) ?? "";
  const championId = parseInt(rawId, 10);
  if (isNaN(championId)) throw Errors.validation("Invalid championId");

  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const mastery = await getChampionMastery(riotAccountId, championId);

  if (!mastery) {
    throw Errors.validation(
      "Not enough ranked games on this champion to compute mastery score. Play at least 5 ranked games."
    );
  }

  return apiSuccess(mastery);
});
