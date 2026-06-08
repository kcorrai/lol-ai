import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

// GET /api/teams/seats — returns seat usage across all teams the user owns
export const GET = withAuth(async (_req, { userId }) => {
  const ownedTeams = await prisma.team.findMany({
    where: { ownerId: userId },
    select: { _count: { select: { members: true } } },
  });

  const totalMembers = ownedTeams.reduce((s, t) => s + t._count.members, 0);
  const maxMembers = ownedTeams.length * 5;

  return apiSuccess({ totalMembers, maxMembers, teamsCount: ownedTeams.length });
});
