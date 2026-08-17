import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { isQuizMode } from "@/domains/quiz";
import { getProgress, recordAttempt } from "@/domains/quiz/services/streakService";

// Streak and today's record for a signed-in player. Anonymous visitors play the
// whole quiz without this — they get a 401 here and keep their board in
// localStorage, which is the point: the account buys persistence, not access.

const bodySchema = z.object({
  mode: z.string().refine(isQuizMode, "Unknown quiz mode"),
  guessCount: z.number().int().min(0).max(500),
  solved: z.boolean(),
});

export const GET = withAuth(async (_req: NextRequest, ctx) =>
  apiSuccess(await getProgress(ctx.userId, new Date()))
);

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

  const { mode, guessCount, solved } = parsed.data;
  return apiSuccess(await recordAttempt(ctx.userId, mode, guessCount, solved, new Date()));
});
