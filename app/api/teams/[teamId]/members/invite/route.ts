import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { inviteMember } from "@/domains/teams/services/teamInviteService";
import type { TeamRole } from "@/domains/teams/types/teams.types";

const VALID_ROLES: TeamRole[] = ["COACH", "PLAYER"];

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  // path: /api/teams/[teamId]/members/invite → teamId is at index -3
  const teamId = segments.at(-3) ?? "";
  if (!teamId) throw Errors.validation("Missing teamId");

  const body = await req.json() as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = (body.role as TeamRole) ?? "PLAYER";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Errors.validation("Valid email required");
  }
  if (!VALID_ROLES.includes(role)) {
    throw Errors.validation("Role must be COACH or PLAYER");
  }

  const result = await inviteMember(teamId, userId, { email, role });
  return apiSuccess(result, 201);
});
