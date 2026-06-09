import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getTeamDashboard } from "@/domains/teams/services/teamService";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  // path: /api/teams/[teamId]/dashboard → teamId at -2
  const teamId = segments.at(-2) ?? "";
  if (!teamId) throw Errors.validation("Missing teamId");

  const rangeParam = req.nextUrl.searchParams.get("range") ?? "7d";
  const validRanges = ["7d", "30d", "90d"] as const;
  const range = (validRanges as readonly string[]).includes(rangeParam)
    ? (rangeParam as "7d" | "30d" | "90d")
    : "7d";

  const data = await getTeamDashboard(teamId, userId, range);
  return apiSuccess(data);
});
