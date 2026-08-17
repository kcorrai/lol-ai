import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getThread, sendMessage } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

export const dynamic = "force-dynamic";

// Generous enough for a real conversation, tight enough that a compromised
// account cannot use the inbox as a delivery mechanism.
const MESSAGE_LIMIT = { limit: 60, windowMs: 300_000 };

const SendBody = z.object({
  body: z.string().trim().min(1).max(4000),
  bookingId: z.string().uuid().nullish(),
});

// GET /api/threads/[conversationId] — the thread, oldest message first.
export function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
): Promise<NextResponse> {
  return withAuth(async (_r, { userId }): Promise<NextResponse> => {
    const thread = await getThread(params.conversationId, userId);
    if (!thread) throw Errors.notFound("Conversation");

    return apiSuccess({ thread });
  })(req);
}

// POST /api/threads/[conversationId] — send one message.
export function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
): Promise<NextResponse> {
  return withAuth(async (r, { userId }): Promise<NextResponse> => {
    const rl = await checkRateLimit(`message:${userId}`, MESSAGE_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

    const parsed = SendBody.safeParse(await r.json().catch(() => null));
    if (!parsed.success) throw Errors.validation("A message is required.");

    const result = await sendMessage(
      params.conversationId,
      userId,
      parsed.data.body,
      parsed.data.bookingId
    );
    if (!result.ok) throw Errors.notFound("Conversation");

    // `notice` is set when something was stripped, so the sender finds out from
    // the response rather than from the message looking odd afterwards.
    return apiSuccess({ message: result.message, notice: result.notice }, 201);
  })(req);
}
