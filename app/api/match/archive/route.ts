import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getAccountPuuid } from "@/domains/riot";
import { parseArchiveFilters } from "@/domains/match/services/matchArchiveFilters";
import { searchArchive } from "@/domains/match/services/matchArchiveService";

export const dynamic = "force-dynamic";

// GET /api/match/archive?riotAccountId=<uuid>&cursor=<id>&limit=<n>&<facets…>
// Faceted search over the player's match archive. Facets are documented in API_DESIGN.md.
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const params = req.nextUrl.searchParams;

  const riotAccountId = params.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("riotAccountId is required");
  await assertOwnsRiotAccount(userId, riotAccountId);

  const puuid = await getAccountPuuid(riotAccountId);
  if (!puuid) throw Errors.notFound("Riot account");

  let filters;
  try {
    filters = parseArchiveFilters(params);
  } catch (err) {
    // Zod's own message names the offending facet, which is more use to a caller than "bad request".
    throw err instanceof ZodError
      ? Errors.validation(err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "))
      : err;
  }

  const limitParam = params.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  if (limit !== undefined && !Number.isFinite(limit))
    throw Errors.validation("limit must be a number");

  const page = await searchArchive(puuid, filters, params.get("cursor") ?? undefined, limit);
  return apiSuccess(page);
});
