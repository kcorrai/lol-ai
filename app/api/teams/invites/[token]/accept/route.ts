import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { acceptInvite } from "@/domains/teams/services/teamInviteService";

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  // path: /api/teams/invites/[token]/accept → token at -2
  const token = segments.at(-2) ?? "";
  if (!token) throw Errors.validation("Missing token");

  const result = await acceptInvite(token, userId);
  return apiSuccess(result);
});
