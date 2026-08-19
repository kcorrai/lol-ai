import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getLanePhaseForUser } from "@/domains/match";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  // .at(-2) rather than .at(-1): this route sits one segment below [matchId].
  const matchId = req.nextUrl.pathname.split("/").at(-2) ?? "";
  if (!matchId) throw Errors.validation("Missing matchId");

  // Null covers both "not this user's match" and "no timeline recorded for it". The service
  // cannot tell the caller apart from an intruder without leaking which matches exist, so both
  // answer 404 and the client renders its empty state on it.
  const lanePhase = await getLanePhaseForUser(matchId, userId);
  if (!lanePhase) throw Errors.notFound("Lane phase");

  return apiSuccess(lanePhase);
});
