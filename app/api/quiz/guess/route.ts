import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ApiError, Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse, getIp } from "@/lib/api/rateLimit";
import { UnknownChampionError, isQuizMode, judgeGuess, revealAnswer } from "@/domains/quiz";
import { logger } from "@/lib/utils/logger";

// Guesses are judged here rather than in the browser. The answer is never sent
// until it is earned, which is the whole reason this endpoint exists instead of
// the client comparing against a champion it was handed up front.
//
// Rate limited because the roster is only 173 names: without a limit a script
// could walk the whole list in one second and hand back the answer.
const GUESS_LIMIT = { limit: 30, windowMs: 60_000 };

const bodySchema = z.object({
  mode: z.string().refine(isQuizMode, "Unknown quiz mode"),
  guess: z.string().min(1).max(40),
  previousGuesses: z.array(z.string().max(40)).max(200).default([]),
});

const revealSchema = z.object({
  mode: z.string().refine(isQuizMode, "Unknown quiz mode"),
  giveUp: z.literal(true),
});

export async function POST(request: NextRequest) {
  try {
    const rateCheck = await checkRateLimit(`quiz-guess:${getIp(request)}`, GUESS_LIMIT);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

    const raw: unknown = await request.json().catch(() => null);
    if (!raw) throw Errors.validation("Body must be JSON");

    const giveUp = revealSchema.safeParse(raw);
    if (giveUp.success) {
      return apiSuccess({ answer: revealAnswer(giveUp.data.mode, new Date()) });
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

    const { mode, guess, previousGuesses } = parsed.data;
    return apiSuccess(judgeGuess(mode, guess, new Date(), previousGuesses));
  } catch (err) {
    if (err instanceof UnknownChampionError) {
      return apiError("UNKNOWN_CHAMPION", `"${err.guess}" is not a champion`, 422);
    }
    if (err instanceof ApiError) return apiError(err.code, err.message, err.statusCode);
    logger.error("[quiz/guess] Unhandled error", err);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
