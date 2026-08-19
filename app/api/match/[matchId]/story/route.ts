import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getMatchStoryForUser } from "@/domains/match";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  // .at(-2) rather than .at(-1): this route sits one segment below [matchId], same as lane-phase.
  const matchId = req.nextUrl.pathname.split("/").at(-2) ?? "";
  if (!matchId) throw Errors.validation("Missing matchId");

  // Null covers both "not this user's match" and "no such match" — see matchStoryService.ts.
  // A match the caller owns but has no captured timeline still returns 200 with hasTimeline: false.
  const story = await getMatchStoryForUser(matchId, userId);
  if (!story) throw Errors.notFound("Match");

  return apiSuccess(story);
});
