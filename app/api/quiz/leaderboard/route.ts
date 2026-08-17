import { NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ApiError, Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse, getIp } from "@/lib/api/rateLimit";
import { getQuizLeaderboard } from "@/domains/quiz/services/quizLeaderboardService";
import { logger } from "@/lib/utils/logger";

// Public, like the rest of the quiz. Signing in adds one thing: the caller's own
// line, which is returned whether or not their profile is public.

const LEADERBOARD_LIMIT = { limit: 60, windowMs: 60_000 };

const querySchema = z.object({ period: z.enum(["today", "week"]).default("today") });

export async function GET(request: NextRequest) {
  try {
    const rateCheck = await checkRateLimit(`quiz-board:${getIp(request)}`, LEADERBOARD_LIMIT);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

    const parsed = querySchema.safeParse({
      period: request.nextUrl.searchParams.get("period") ?? "today",
    });
    if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

    const session = await getServerSession(authOptions);
    const board = await getQuizLeaderboard(parsed.data.period, new Date(), session?.user?.id);
    return apiSuccess(board);
  } catch (err) {
    if (err instanceof ApiError) return apiError(err.code, err.message, err.statusCode);
    logger.error("[quiz/leaderboard] Unhandled error", err);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
