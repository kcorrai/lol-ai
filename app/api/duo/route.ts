import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import {
  getActiveDuo,
  setDuo,
  clearDuo,
  findTeammateByRiotId,
} from "@/domains/analysis/services/duoService";

const DUO_LIMIT = { limit: 60, windowMs: 3_600_000 };

const SetDuoSchema = z
  .object({
    riotAccountId: z.string().uuid(),
    puuid: z.string().min(1).optional(),
    riotId: z
      .string()
      .regex(/^.+#.+$/, "Riot ID must look like Name#TAG")
      .optional(),
  })
  .refine((v) => v.puuid || v.riotId, { message: "Provide either puuid or riotId" });

async function guard(req: NextRequest, userId: string, riotAccountId: string | null) {
  const rate = await checkRateLimit(`duo:${getIp(req)}`, DUO_LIMIT);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs, rate.limit);
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");
  await assertOwnsRiotAccount(userId, riotAccountId);
  return null;
}

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  const blocked = await guard(req, userId, riotAccountId);
  if (blocked) return blocked;

  return apiSuccess(await getActiveDuo(riotAccountId!));
}, { deviceAccess: true });

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  // `.parse` threw a ZodError, which `withAuth` does not recognise — so every bad body
  // answered 500 instead of saying what was wrong.
  const parsed = SetDuoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid duo");
  const body = parsed.data;
  const blocked = await guard(req, userId, body.riotAccountId);
  if (blocked) return blocked;

  let puuid = body.puuid;
  if (!puuid && body.riotId) {
    const [gameName, tagLine] = body.riotId.split("#");
    const found = await findTeammateByRiotId(body.riotAccountId, gameName, tagLine);
    if (!found) throw Errors.validation("That player isn't in your synced match history");
    puuid = found.puuid;
  }

  return apiSuccess(await setDuo(body.riotAccountId, puuid!));
}, { deviceAccess: true });

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  const blocked = await guard(req, userId, riotAccountId);
  if (blocked) return blocked;

  await clearDuo(riotAccountId!);
  return apiSuccess({ cleared: true });
}, { deviceAccess: true });
