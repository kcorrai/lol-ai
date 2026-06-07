import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getTeamMembers, deleteTeam } from "@/domains/teams/services/teamService";

function extractTeamId(req: NextRequest): string {
  const id = req.nextUrl.pathname.split("/").at(-1) ?? "";
  if (!id) throw Errors.validation("Missing teamId");
  return id;
}

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const teamId = extractTeamId(req);
  const members = await getTeamMembers(teamId, userId);
  return apiSuccess({ teamId, members });
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const teamId = extractTeamId(req);
  await deleteTeam(teamId, userId);
  return apiSuccess({ deleted: true });
});
