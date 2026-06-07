import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { buildMatchupMatrix } from "@/domains/analysis/services/matchupService";

export const dynamic = "force-dynamic";

// GET /api/analysis/matchup-matrix?riotAccountId=<uuid>&position=<opt>
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("riotAccountId is required");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const position = req.nextUrl.searchParams.get("position") ?? undefined;
  const matrix = await buildMatchupMatrix(riotAccountId, position);
  return apiSuccess(matrix);
});
