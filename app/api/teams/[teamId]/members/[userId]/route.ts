import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { removeMember } from "@/domains/teams/services/teamService";

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  // path: /api/teams/[teamId]/members/[userId] → teamId at -3, targetUserId at -1
  const teamId = segments.at(-3) ?? "";
  const targetUserId = segments.at(-1) ?? "";
  if (!teamId || !targetUserId) throw Errors.validation("Missing teamId or userId");

  await removeMember(teamId, targetUserId, userId);
  return apiSuccess({ removed: true });
});
