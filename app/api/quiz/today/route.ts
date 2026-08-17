import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ApiError, Errors } from "@/lib/api/errors";
import { buildPuzzle, championCatalogue } from "@/domains/quiz";
import { isQuizMode } from "@/domains/quiz";
import { logger } from "@/lib/utils/logger";

// Public and anonymous — the puzzle is the same for everyone and carries no
// answer, so there is nothing here worth authenticating.

const querySchema = z.object({
  mode: z.string().refine(isQuizMode, "Unknown quiz mode"),
  misses: z.coerce.number().int().min(0).max(100).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = querySchema.safeParse({
      mode: searchParams.get("mode") ?? "",
      misses: searchParams.get("misses") ?? 0,
    });
    if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

    const puzzle = buildPuzzle(parsed.data.mode, new Date(), parsed.data.misses);
    return apiSuccess({ puzzle, champions: championCatalogue() });
  } catch (err) {
    if (err instanceof ApiError) return apiError(err.code, err.message, err.statusCode);
    logger.error("[quiz/today] Unhandled error", err);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
