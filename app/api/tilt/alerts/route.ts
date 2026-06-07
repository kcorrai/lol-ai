import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/tilt/alerts — returns unacknowledged tilt alerts for the current user
export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const alerts = await prisma.tiltAlert.findMany({
    where: { userId, acknowledged: false },
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { id: true, message: true, streakLength: true, createdAt: true },
  });

  return apiSuccess(alerts);
});
