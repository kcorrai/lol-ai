import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { assertOwnsRiotAccount, assertCanDisconnectRiotAccount } from "@/lib/auth/authorization";
import { disconnectAccount, setPrimaryAccount } from "@/domains/riot/services/accountService";
import { Errors } from "@/lib/api/errors";

function getRiotAccountId(req: NextRequest): string {
  return req.nextUrl.pathname.split("/").at(-1) ?? "";
}

const patchSchema = z.object({ action: z.literal("set_primary") });

export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = getRiotAccountId(req);
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  let body: unknown;
  try { body = await req.json(); } catch { throw Errors.validation("Invalid JSON body"); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

  await assertOwnsRiotAccount(userId, riotAccountId);
  await setPrimaryAccount(userId, riotAccountId);
  return apiSuccess({ primary: true });
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = getRiotAccountId(req);
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertCanDisconnectRiotAccount(userId);
  await assertOwnsRiotAccount(userId, riotAccountId);
  await disconnectAccount(userId, riotAccountId);
  return apiSuccess({ disconnected: true });
});
