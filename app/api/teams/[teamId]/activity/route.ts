import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { getTeamActivityFeed } from "@/domains/teams/services/teamService";

function extractTeamId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  return segments[segments.indexOf("teams") + 1] ?? "";
}

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const teamId = extractTeamId(req);
  const activities = await getTeamActivityFeed(teamId, userId);
  return apiSuccess({ activities });
});
