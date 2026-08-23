import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { dispatchOrRunInProcess } from "@/lib/inngest/dispatch";
import { runSyncWithStatus } from "@/domains/riot/services/matchSyncService";
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
    select: { syncStatus: true, syncStartedAt: true },
  });
  if (!account) throw Errors.notFound("Riot account");

  // Prevent a duplicate sync while one is genuinely in progress — but treat a stale in-progress
  // state as stuck (a prior run died, or Inngest never processed the event) and allow a fresh sync,
  // otherwise the account could never be re-synced (TASK-223).
  const inProgress = account.syncStatus === "RUNNING" || account.syncStatus === "PENDING";
  const startedMs = account.syncStartedAt?.getTime() ?? 0;
  const isStuck = Date.now() - startedMs > 5 * 60 * 1000;
  if (inProgress && !isStuck) {
    return apiSuccess({ status: account.syncStatus }, 202);
  }

  await prisma.riotAccount.update({
    where: { id: riotAccountId },
    data: { syncStatus: "PENDING", syncStartedAt: new Date(), lastSyncError: null },
  });

  // Durable via Inngest in production; runs in-process if Inngest is unavailable (TASK-223).
  await dispatchOrRunInProcess(
    { name: "riot/sync.requested", data: { riotAccountId, userId } satisfies MatchSyncPayload },
    () => runSyncWithStatus(riotAccountId, userId)
  );

  return apiSuccess({ status: "pending", riotAccountId }, 202);
});
