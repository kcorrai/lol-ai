import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { z } from "zod";
import { httpUrl } from "@/lib/security/url";
import { createTeam, getMyTeams } from "@/domains/teams/services/teamService";

// `logoUrl` is validated the same way PATCH on this resource validates it. POST took
// any string, so a team could be created with a `javascript:` or `data:` logo that the
// update endpoint would have refused — a rule enforced on one half of a resource is
// not a rule. A malformed body threw out of the handler as a 500 as well.
const CreateTeamSchema = z.object({
  name: z.string().trim().min(2).max(64),
  logoUrl: httpUrl.optional(),
});

export const GET = withAuth(async (_req, { userId }) => {
  const teams = await getMyTeams(userId);
  return apiSuccess(teams);
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const parsed = CreateTeamSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid team");
  }

  const team = await createTeam(userId, parsed.data);
  return apiSuccess(team, 201);
});
