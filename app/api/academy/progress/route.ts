import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import {
  markLessonOpened,
  openAssignment,
  resolveLesson,
  restartAssignment,
  submitLessonAttempt,
} from "@/domains/academy";
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
  z.object({ action: z.literal("restart-assignment"), lessonId: z.string().min(1) }),
]);

// POST /api/academy/progress — open a lesson, submit its drills, or restart its field assignment.
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw Errors.validation("Invalid request body");

  const body = parsed.data;
  // Resolves both kinds: a registry lookup, or the cached analysis a champion lesson was
  // generated from. A champion lesson whose analysis has expired is genuinely gone, and 404 is
  // the honest answer — the drills the client is holding no longer exist to be graded.
  if (!(await resolveLesson(userId, body.lessonId))) throw Errors.notFound("Lesson");

  if (body.action === "open") {
    await markLessonOpened(userId, body.lessonId);
    return apiSuccess({ ok: true });
  }

  if (body.action === "restart-assignment") {
    return apiSuccess({ assignment: await restartAssignment(userId, body.lessonId) });
  }

  const { plan } = await getCurrentSubscription(userId);
  const result = await submitLessonAttempt(userId, body.lessonId, body.attempts, plan !== "free");

  // Passing the drills starts the Proof of Practice clock. A player with no synced account
  // gets null back and still keeps the completion — see openAssignment.
  const assignment = result.progress.status === "completed" ? await openAssignment(userId, body.lessonId) : null;

  return apiSuccess({ ...result, assignment });
});
