import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess, apiError } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getPersonalQuiz, gradePersonalAnswer } from "@/domains/quiz/services/personalQuizService";

// The personal quiz is built from the player's own match history, so unlike the
// six global modes it needs an account and a linked Riot account. That is the
// point: it is the reason to sign in, not a wall in front of the game.

const answerSchema = z.object({
  questionId: z.string().min(1).max(64),
  choice: z.string().min(1).max(80),
});

export const GET = withAuth(async (_req: NextRequest, ctx) =>
  apiSuccess(await getPersonalQuiz(ctx.userId, new Date()))
);

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const parsed = answerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

  const result = await gradePersonalAnswer(
    ctx.userId,
    parsed.data.questionId,
    parsed.data.choice,
    new Date()
  );
  if (!result) return apiError("NOT_FOUND", "That question is not part of today's set", 404);
  return apiSuccess(result);
});
