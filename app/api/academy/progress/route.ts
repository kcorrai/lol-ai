import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getLessonById, markLessonOpened, submitLessonAttempt } from "@/domains/academy";
import { getCurrentSubscription } from "@/lib/subscription/subscriptionService";

export const dynamic = "force-dynamic";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("open"), lessonId: z.string().min(1) }),
  z.object({
    action: z.literal("submit"),
    lessonId: z.string().min(1),
    attempts: z
      .array(z.object({ drillId: z.string().min(1), answer: z.array(z.string()) }))
      .max(20),
  }),
]);

// POST /api/academy/progress — open a lesson, or submit its drills for grading.
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw Errors.validation("Invalid request body");

  const body = parsed.data;
  if (!getLessonById(body.lessonId)) throw Errors.notFound("Lesson");

  if (body.action === "open") {
    await markLessonOpened(userId, body.lessonId);
    return apiSuccess({ ok: true });
  }

  const { plan } = await getCurrentSubscription(userId);
  return apiSuccess(
    await submitLessonAttempt(userId, body.lessonId, body.attempts, plan !== "free")
  );
});
