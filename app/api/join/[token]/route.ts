import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { acceptLinkInvite } from "@/domains/teams/services/teamService";

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const token = req.nextUrl.pathname.split("/").at(-1) ?? "";
  const result = await acceptLinkInvite(token, userId);
  return apiSuccess(result);
});
