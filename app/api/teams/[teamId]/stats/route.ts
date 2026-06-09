import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getTeamStats } from "@/domains/teams/services/teamStatsService";
import { assertCoachAccess } from "@/domains/teams/services/teamService";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const teamId = segments.at(-2) ?? "";
  if (!teamId) throw Errors.validation("Missing teamId");

  const range = (req.nextUrl.searchParams.get("range") ?? "7d") as "7d" | "30d" | "90d";
  const validRanges = ["7d", "30d", "90d"];
  if (!validRanges.includes(range)) throw Errors.validation("Invalid range. Use 7d, 30d or 90d");

  await assertCoachAccess(teamId, userId);
  const data = await getTeamStats(teamId, range);
  return apiSuccess(data);
});
