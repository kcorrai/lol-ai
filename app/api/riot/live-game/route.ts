import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getLiveDraft } from "@/domains/riot/services/liveGameService";

// Deliberately tight: this hits the Riot API on every call and the key is rate limited. The UI
// only fires it on a button press, never on a poll.
const LIVE_GAME_LIMIT = { limit: 30, windowMs: 600_000 };

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const rate = await checkRateLimit(`live-game:${getIp(req)}`, LIVE_GAME_LIMIT);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs, rate.limit);

  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  return apiSuccess(await getLiveDraft(riotAccountId));
});
