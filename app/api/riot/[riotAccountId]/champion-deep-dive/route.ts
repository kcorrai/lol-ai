import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getChampionDeepDive } from "@/domains/champions/services/championDeepDiveService";

// GET /api/riot/[riotAccountId]/champion-deep-dive?champion=Jinx
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const riotAccountId = segments.at(-2) ?? "";
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  const championName = req.nextUrl.searchParams.get("champion");
  if (!championName) throw Errors.validation("Missing champion query param");

  await assertOwnsRiotAccount(userId, riotAccountId);
  const result = await getChampionDeepDive(riotAccountId, championName);
  return apiSuccess(result);
});
