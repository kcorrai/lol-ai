import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listThreads, openThread } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

export const dynamic = "force-dynamic";

const OpenBody = z.object({ coachProfileId: z.string().uuid() });

// GET /api/threads — every conversation the caller is in.
export const GET = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  return apiSuccess({ threads: await listThreads(userId) });
});

const OPEN_LIMIT = { limit: 30, windowMs: 3_600_000 };

// POST /api/threads — the student's thread with a coach, created on first use.
//
// A booking is the ticket. Open messaging would turn the storefront into an
// inbox for anyone who can type a slug.
export const POST = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const rl = await checkRateLimit(`thread:${userId}`, OPEN_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const parsed = OpenBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw Errors.validation("A coach is required.");

  const result = await openThread(parsed.data.coachProfileId, userId);
  if (!result.ok) throw Errors.forbidden("Book a session with this coach before messaging them.");

  return apiSuccess({ conversationId: result.conversationId });
});
