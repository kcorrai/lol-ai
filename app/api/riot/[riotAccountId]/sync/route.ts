import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { inngest } from "@/inngest/client";
import { Errors } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import type { MatchSyncPayload } from "@/inngest/functions/matchSync";

const SYNC_LIMIT = { limit: 30, windowMs: 3_600_000 };

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`sync:${userId}`, SYNC_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  const segments = req.nextUrl.pathname.split("/");
  const riotAccountId = segments.at(-2) ?? "";
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { syncStatus: true },
  });
  if (!account) throw Errors.notFound("Riot account");

  // Prevent duplicate sync when one is already in progress
  if (account.syncStatus === "RUNNING" || account.syncStatus === "PENDING") {
    return apiSuccess({ status: account.syncStatus }, 202);
  }

  await prisma.riotAccount.update({
    where: { id: riotAccountId },
    data: { syncStatus: "PENDING", lastSyncError: null },
  });

  await inngest.send({
    name: "riot/sync.requested",
    data: { riotAccountId, userId } satisfies MatchSyncPayload,
  });

  return apiSuccess({ status: "pending", riotAccountId }, 202);
});
