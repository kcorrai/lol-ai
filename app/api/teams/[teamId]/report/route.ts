import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getTeamReport, generateTeamReport } from "@/domains/teams/services/teamReportService";
import { assertCoachAccess } from "@/domains/teams/services/teamService";

function extractTeamId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  // /api/teams/[teamId]/report → teamId at -2
  return segments.at(-2) ?? "";
}

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const teamId = extractTeamId(req);
  if (!teamId) throw Errors.validation("Missing teamId");

  await assertCoachAccess(teamId, userId);
  const report = await getTeamReport(teamId);
  return apiSuccess({ report });
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const teamId = extractTeamId(req);
  if (!teamId) throw Errors.validation("Missing teamId");

  await assertCoachAccess(teamId, userId);
  const report = await generateTeamReport(teamId, userId);
  return apiSuccess({ report }, 201);
});
