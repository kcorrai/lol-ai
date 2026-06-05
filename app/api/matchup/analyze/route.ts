import { NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ApiError, Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse, getIp } from "@/lib/api/rateLimit";
import { getPlanLimits } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { getMatchupAnalysis } from "@/domains/matchup";
import { logger } from "@/lib/utils/logger";

const MATCHUP_LIMIT = { limit: 15, windowMs: 60_000 };
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

const bodySchema = z.object({
  champion: z.string().min(1),
  opponent: z.string().min(1),
  role: z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request);
    const rateCheck = await checkRateLimit(`matchup-api:${ip}`, MATCHUP_LIMIT);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw Errors.validation("Invalid JSON body");
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

    const { champion, opponent, role } = parsed.data;

    if (champion.toLowerCase() === opponent.toLowerCase()) {
      throw Errors.validation("İki farklı şampiyon seçilmelidir");
    }

    const [dbChampion, dbOpponent] = await Promise.all([
      prisma.champion.findFirst({
        where: { name: { equals: champion, mode: "insensitive" } },
        select: { name: true },
      }),
      prisma.champion.findFirst({
        where: { name: { equals: opponent, mode: "insensitive" } },
        select: { name: true },
      }),
    ]);

    if (!dbChampion) throw Errors.notFound("Şampiyon");
    if (!dbOpponent) throw Errors.notFound("Rakip şampiyon");

    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const limits = await getPlanLimits(session.user.id);
      if (limits.matchupAnalysisPerDay !== -1) {
        const dailyCheck = await checkRateLimit(
          `matchup-daily:${session.user.id}`,
          { limit: limits.matchupAnalysisPerDay, windowMs: DAILY_WINDOW_MS }
        );
        if (!dailyCheck.allowed) {
          return rateLimitResponse(dailyCheck.retryAfterMs, dailyCheck.limit);
        }
      }
    }

    const result = await getMatchupAnalysis(dbChampion.name, dbOpponent.name, role);
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof ApiError) {
      return apiError(err.code, err.message, err.statusCode);
    }
    logger.error("[matchup] Unhandled error", err);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
