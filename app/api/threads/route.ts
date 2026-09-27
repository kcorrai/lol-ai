import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listThreads, openThread } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors, ApiError } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

export const dynamic = "force-dynamic";

// By id from inside the app, by slug from a public profile — which never learns the id.
const OpenBody = z.union([
  z.object({ coachProfileId: z.string().uuid() }),
  z.object({ coachSlug: z.string().min(1).max(80) }),
]);

// GET /api/threads — every conversation the caller is in.
export const GET = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  return apiSuccess({ threads: await listThreads(userId) });
});

const OPEN_LIMIT = { limit: 30, windowMs: 3_600_000 };

// POST /api/threads — the student's thread with a coach, created on first use.
//
// No booking needed: a student may ask first, within the daily limit in the
// domain's question gate. Contact details are stripped from every message.
export const POST = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const rl = await checkRateLimit(`thread:${userId}`, OPEN_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const parsed = OpenBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw Errors.validation("A coach is required.");

  const coach =
    "coachProfileId" in parsed.data
      ? { id: parsed.data.coachProfileId }
      : { slug: parsed.data.coachSlug };
  const result = await openThread(coach, userId);
  if (!result.ok) throw openRefusal(result.reason);

  return apiSuccess({ conversationId: result.conversationId });
});

function openRefusal(reason: "not-found" | "self" | "question-limit"): ApiError {
  if (reason === "not-found") return Errors.notFound("Coach");
  if (reason === "self") return Errors.forbidden("You cannot message yourself.");
  return Errors.conflict(
    "You have asked several new coaches today. Wait for an answer, or book a session to keep talking."
  );
}
