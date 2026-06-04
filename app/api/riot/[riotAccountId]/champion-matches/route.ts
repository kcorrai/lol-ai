import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

// GET /api/riot/[riotAccountId]/champion-matches?champion=Yasuo
// Returns up to 10 ranked match IDs for a specific champion.
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const riotAccountId = segments.at(-2) ?? "";
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  const champion = req.nextUrl.searchParams.get("champion");
  if (!champion) throw Errors.validation("Missing champion query param");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const participants = await prisma.matchParticipant.findMany({
    where: {
      riotAccountId,
      championName: champion,
      match: { queueType: "RANKED_SOLO_5x5" },
    },
    orderBy: { match: { gameStart: "desc" } },
    take: 10,
    select: { matchId: true },
  });

  const matchIds = participants.map((p) => p.matchId);
  return apiSuccess({ matchIds });
});
