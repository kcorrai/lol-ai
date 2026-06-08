import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { cancelInvite } from "@/domains/teams/services/teamInviteService";

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const inviteId = segments.at(-1) ?? "";
  const teamId = segments.at(-3) ?? "";
  if (!teamId || !inviteId) throw Errors.validation("Missing teamId or inviteId");

  await cancelInvite(teamId, inviteId, userId);
  return apiSuccess({ cancelled: true });
});
