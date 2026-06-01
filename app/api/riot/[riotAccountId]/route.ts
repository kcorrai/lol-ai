import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { disconnectAccount } from "@/domains/riot/services/accountService";
import { Errors } from "@/lib/api/errors";

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  // URL: /api/riot/[riotAccountId]
  const riotAccountId = req.nextUrl.pathname.split("/").at(-1) ?? "";
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);
  await disconnectAccount(userId, riotAccountId);
  return apiSuccess({ disconnected: true });
});
