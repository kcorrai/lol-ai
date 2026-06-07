import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/challenges/[id]/progress — returns progress for a specific challenge
export function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(async (_r, { userId }) => {
    const row = await prisma.userChallenge.findFirst({
      where: { challengeId: params.id, userId },
      select: { progress: true, completed: true, completedAt: true },
    });

    if (!row) throw Errors.notFound("Challenge");
    return apiSuccess(row);
  })(req);
}
