import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  // /api/riot/[riotAccountId]/sync/status → segments[-3] = riotAccountId
  const riotAccountId = segments.at(-3) ?? "";
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: {
      syncStatus: true,
      syncStartedAt: true,
      syncCompletedAt: true,
      lastSyncError: true,
      lastSyncedAt: true,
    },
  });
  if (!account) throw Errors.notFound("Riot account");

  return apiSuccess({
    status: account.syncStatus,
    syncStartedAt: account.syncStartedAt,
    syncCompletedAt: account.syncCompletedAt,
    lastSyncError: account.lastSyncError,
    lastSyncedAt: account.lastSyncedAt,
  });
});
