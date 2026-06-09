import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { z } from "zod";
import { getTeamMembers, updateTeam, deleteTeam } from "@/domains/teams/services/teamService";

const updateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  logoUrl: z.string().url().optional().nullable(),
});

function extractTeamId(req: NextRequest): string {
  const id = req.nextUrl.pathname.split("/").at(-1) ?? "";
  if (!id) throw Errors.validation("Missing teamId");
  return id;
}

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const teamId = extractTeamId(req);
  const members = await getTeamMembers(teamId, userId);
  return apiSuccess({ teamId, members });
});

export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  const teamId = extractTeamId(req);
  let body: unknown;
  try { body = await req.json(); } catch { throw Errors.validation("Invalid JSON body"); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);
  const { logoUrl, ...rest } = parsed.data;
  await updateTeam(teamId, userId, { ...rest, logoUrl: logoUrl ?? undefined });
  return apiSuccess({ updated: true });
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const teamId = extractTeamId(req);
  await deleteTeam(teamId, userId);
  return apiSuccess({ deleted: true });
});
