import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { ACHIEVEMENT_CATALOG } from "@/types/achievement";

export const dynamic = "force-dynamic";

// GET /api/achievements — returns catalog split into earned + locked for the current user
export const GET = withAuth(async (_req, { userId }) => {
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, earnedAt: true, seen: true },
    orderBy: { earnedAt: "desc" },
  });

  const earnedMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]));

  const earned = ACHIEVEMENT_CATALOG.filter((a) => earnedMap.has(a.id)).map((a) => ({
    ...a,
    earnedAt: earnedMap.get(a.id)!.earnedAt,
    seen: earnedMap.get(a.id)!.seen,
  }));

  const locked = ACHIEVEMENT_CATALOG.filter((a) => !earnedMap.has(a.id));

  return apiSuccess({
    earned,
    locked,
    earnedCount: earned.length,
    total: ACHIEVEMENT_CATALOG.length,
  });
}, { deviceAccess: true });
