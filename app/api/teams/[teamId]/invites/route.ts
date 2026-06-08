import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getPendingInvites } from "@/domains/teams/services/teamInviteService";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const teamId = segments.at(-2) ?? "";
  if (!teamId) throw Errors.validation("Missing teamId");

  const invites = await getPendingInvites(teamId, userId);
  return apiSuccess(invites);
});
