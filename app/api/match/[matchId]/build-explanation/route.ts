import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { prisma } from "@/lib/db/prisma";
import { explainBuild } from "@/domains/match";

const BUILD_LIMIT = { limit: 10, windowMs: 60 * 60_000 };

const querySchema = z.object({
  puuid: z.string().min(1),
});

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`build-explanation:${userId}`, BUILD_LIMIT);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);
  }

  const segments = req.nextUrl.pathname.split("/");
  const matchId = segments[3];
  if (!matchId) throw Errors.validation("Missing matchId");

  const raw = { puuid: req.nextUrl.searchParams.get("puuid") ?? "" };
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

  const { puuid } = parsed.data;

  const participant = await prisma.matchParticipant.findFirst({
    where: { matchId, puuid, riotAccount: { userId } },
    select: { puuid: true },
  });
  if (!participant) throw Errors.forbidden("Not your match participant");

  const result = await explainBuild(matchId, puuid);
  return apiSuccess(result);
});
