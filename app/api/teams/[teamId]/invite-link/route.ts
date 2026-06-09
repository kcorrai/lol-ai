import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { getOrCreateInviteLink, revokeInviteLink } from "@/domains/teams/services/teamService";

function extractTeamId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  return segments[segments.indexOf("teams") + 1] ?? "";
}

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const teamId = extractTeamId(req);
  const result = await getOrCreateInviteLink(teamId, userId);
  return apiSuccess(result);
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const teamId = extractTeamId(req);
  await revokeInviteLink(teamId, userId);
  return apiSuccess({ revoked: true });
});
