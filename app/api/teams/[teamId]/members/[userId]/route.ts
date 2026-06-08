import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { removeMember, updateMemberRole } from "@/domains/teams/services/teamService";
type UpdatableRole = "COACH" | "PLAYER";
const UPDATABLE_ROLES: UpdatableRole[] = ["COACH", "PLAYER"];

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const teamId = segments.at(-3) ?? "";
  const targetUserId = segments.at(-1) ?? "";
  if (!teamId || !targetUserId) throw Errors.validation("Missing teamId or userId");

  await removeMember(teamId, targetUserId, userId);
  return apiSuccess({ removed: true });
});

export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const teamId = segments.at(-3) ?? "";
  const targetUserId = segments.at(-1) ?? "";
  if (!teamId || !targetUserId) throw Errors.validation("Missing teamId or userId");

  const body = await req.json() as Record<string, unknown>;
  const role = body.role as UpdatableRole;
  if (!UPDATABLE_ROLES.includes(role)) throw Errors.validation("Role must be COACH or PLAYER");

  await updateMemberRole(teamId, targetUserId, userId, role);
  return apiSuccess({ updated: true });
});
