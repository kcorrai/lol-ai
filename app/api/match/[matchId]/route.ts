import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getMatchDetail } from "@/domains/match";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const matchId = req.nextUrl.pathname.split("/").at(-1) ?? "";
  if (!matchId) throw Errors.validation("Missing matchId");

  const detail = await getMatchDetail(matchId, userId);
  if (!detail) throw Errors.notFound("Match");

  return apiSuccess(detail);
});
