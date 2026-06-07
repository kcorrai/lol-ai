import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { createTeam, getMyTeams } from "@/domains/teams/services/teamService";

export const GET = withAuth(async (_req, { userId }) => {
  const teams = await getMyTeams(userId);
  return apiSuccess(teams);
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json() as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const logoUrl = typeof body.logoUrl === "string" ? body.logoUrl.trim() : undefined;

  if (!name || name.length < 2 || name.length > 64) {
    throw Errors.validation("Team name must be between 2 and 64 characters");
  }

  const team = await createTeam(userId, { name, logoUrl });
  return apiSuccess(team, 201);
});
