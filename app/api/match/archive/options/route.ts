import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getAccountPuuid } from "@/domains/riot";
import { archiveFacetOptions } from "@/domains/match/services/matchArchiveService";

export const dynamic = "force-dynamic";

// GET /api/match/archive/options?riotAccountId=<uuid>
// The champions, patches and queues actually present in this player's archive. The filter console
// offers only these, so a search can never be built that is guaranteed to return nothing.
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("riotAccountId is required");
  await assertOwnsRiotAccount(userId, riotAccountId);

  const puuid = await getAccountPuuid(riotAccountId);
  if (!puuid) throw Errors.notFound("Riot account");

  return apiSuccess(await archiveFacetOptions(puuid));
});
