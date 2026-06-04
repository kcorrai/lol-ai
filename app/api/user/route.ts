import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

const DELETE_LIMIT = { limit: 3, windowMs: 86_400_000 }; // 3 attempts per day

export const DELETE = withAuth(async (_req: NextRequest, { userId, userEmail }) => {
  const rl = await checkRateLimit(`delete-account:${userId}`, DELETE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  // Clean up verification tokens tied to the user's email before deleting the user.
  // These are not cascade-linked to User in the schema (NextAuth constraint).
  if (userEmail) {
    await prisma.verificationToken.deleteMany({ where: { identifier: userEmail } });
  }

  // Deleting the user triggers cascades for:
  //   Account, Session, Profile, Subscription, Notification
  //   → RiotAccount → ChampionStat, RankedHistory, PerformanceSnapshot, CoachingReport → AiAnalysis
  // MatchParticipant.riotAccountId is set to NULL (nullable FK) — match data for
  // other players is preserved; the deleted user's PUUID is simply de-linked.
  await prisma.user.delete({ where: { id: userId } });

  logger.info("[account] User deleted", { userId });

  return apiSuccess({ deleted: true });
});
