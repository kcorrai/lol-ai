import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface SeenBody {
  achievementIds: string[];
}

// POST /api/achievements/seen — mark achievements as seen (toast dismissed)
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  let body: SeenBody;
  try {
    body = (await req.json()) as SeenBody;
  } catch {
    throw Errors.validation("Invalid JSON body");
  }

  const { achievementIds } = body;
  if (!Array.isArray(achievementIds) || achievementIds.length === 0) {
    throw Errors.validation("achievementIds must be a non-empty array");
  }

  await prisma.userAchievement.updateMany({
    where: { userId, achievementId: { in: achievementIds } },
    data: { seen: true },
  });

  return apiSuccess({ updated: achievementIds.length });
});
