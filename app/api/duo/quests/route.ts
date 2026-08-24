import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getDuoQuests } from "@/domains/analysis/services/duoQuestService";

export const dynamic = "force-dynamic";

const QUESTS_LIMIT = { limit: 60, windowMs: 3_600_000 };

// GET /api/duo/quests?riotAccountId= — this week's duo quests with progress. Generation happens
// here on read; the unique index on (account, partner, key, week) keeps that idempotent.
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const rate = await checkRateLimit(`duo-quests:${getIp(req)}`, QUESTS_LIMIT);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs, rate.limit);

  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  return apiSuccess(await getDuoQuests(riotAccountId));
}, { deviceAccess: true });
