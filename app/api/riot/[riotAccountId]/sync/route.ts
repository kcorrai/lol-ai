import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import {
  requestSyncIfStale,
  SYNC_ATTEMPT_COOLDOWN_MS,
} from "@/domains/riot/services/syncFreshness";
import { Errors } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

const SYNC_LIMIT = { limit: 30, windowMs: 3_600_000 };

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`sync:${userId}`, SYNC_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  const segments = req.nextUrl.pathname.split("/");
  const riotAccountId = segments.at(-2) ?? "";
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  // Freshness, the in-progress check and the cooldown between attempts all live with the overlay's
  // identical path, so a failing sync cannot be retried by every dashboard visit (LA-126).
  const result = await requestSyncIfStale(
    riotAccountId,
    userId,
    new Date(),
    SYNC_ATTEMPT_COOLDOWN_MS
  );
  if (result.reason === "missing") throw Errors.notFound("Riot account");
  if (!result.requested) {
    return apiSuccess({ status: result.status ?? "IDLE", riotAccountId }, 202);
  }

  return apiSuccess({ status: "pending", riotAccountId }, 202);
});
