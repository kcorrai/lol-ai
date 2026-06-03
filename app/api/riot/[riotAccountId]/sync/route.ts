import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { syncAccount } from "@/domains/riot/services/matchSyncService";
import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

const SYNC_LIMIT = { limit: 30, windowMs: 3_600_000 };

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = checkRateLimit(`sync:${userId}`, SYNC_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  // URL: /api/riot/[riotAccountId]/sync
  const segments = req.nextUrl.pathname.split("/");
  const riotAccountId = segments.at(-2) ?? "";
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { lastSyncedAt: true },
  });
  if (!account) throw Errors.notFound("Riot account");

  // Manual sync always runs (staleness guard only applies to background auto-sync)
  const result = await syncAccount(riotAccountId, true);
  return apiSuccess({ status: "synced", ...result });
});
