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
  // Bounded, and every entry checked. An unbounded array of arbitrary values became an
  // unbounded `IN (…)` — the site has fewer than a hundred achievements, so anything
  // past that is somebody testing how large a query they can make us build.
  if (
    !Array.isArray(achievementIds) ||
    achievementIds.length === 0 ||
    achievementIds.length > 100 ||
    achievementIds.some((id) => typeof id !== "string" || id.length > 64)
  ) {
    throw Errors.validation("achievementIds must be a non-empty array of up to 100 ids");
  }

  await prisma.userAchievement.updateMany({
    where: { userId, achievementId: { in: achievementIds } },
    data: { seen: true },
  });

  return apiSuccess({ updated: achievementIds.length });
});
