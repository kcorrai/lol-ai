import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { prisma } from "@/lib/db/prisma";
import { buildCoachChatContext, createCoachChatStream } from "@/domains/coaching/services/coachChatService";
import type { ChatMessage } from "@/lib/ai/types";
import type { CoachPersona } from "@/lib/ai/chatSystemPrompt";

const DAILY_LIMIT_FREE = 5;
const DAILY_LIMIT_PRO  = 50;
const DAY_MS           = 24 * 60 * 60 * 1000;

// The transcript arrives from the browser on every turn, so it is input, not state.
// It used to be cast to `ChatMessage[]` and forwarded unread, which let a caller send
// `role: "system"` — overwriting the coach's own instructions with their own — and
// forty messages of unbounded length, billed to us. Roles are limited to the two a
// client is entitled to author, and the whole transcript to something a real
// conversation fits inside.
const MAX_MESSAGE_CHARS = 4_000;
const MAX_TRANSCRIPT_CHARS = 24_000;

const MessagesSchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(MAX_MESSAGE_CHARS),
    })
  )
  .min(1)
  .max(40)
  .refine(
    (msgs) => msgs.reduce((n, m) => n + m.content.length, 0) <= MAX_TRANSCRIPT_CHARS,
    "Conversation too long"
  );

function errJson(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}

// POST /api/riot/[riotAccountId]/chat — returns text/plain stream
export async function POST(req: NextRequest): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return errJson("Authentication required", 401);
  const userId = session.user.id;

  const riotAccountId = req.nextUrl.pathname.split("/").at(-2) ?? "";
  if (!riotAccountId) return errJson("Missing riotAccountId", 400);

  try {
    await assertOwnsRiotAccount(userId, riotAccountId);
  } catch {
    return errJson("Forbidden", 403);
  }

  // Rate limit by subscription plan
  const sub = await prisma.subscription.findUnique({ where: { userId }, select: { plan: true } });
  const isPro = sub?.plan === "pro" || sub?.plan === "elite";
  const dailyLimit = isPro ? DAILY_LIMIT_PRO : DAILY_LIMIT_FREE;

  const rl = await checkRateLimit(`chat:${userId}`, { limit: dailyLimit, windowMs: DAY_MS });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Daily message limit reached. Upgrade to Pro for 50 messages/day." } },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { messages?: unknown; persona?: unknown };
  const parsed = MessagesSchema.safeParse(body.messages);
  if (!parsed.success) {
    return errJson(parsed.error.issues[0]?.message ?? "messages array is required", 400);
  }
  const messages: ChatMessage[] = parsed.data;

  const persona: CoachPersona = ["direct", "analytical", "motivational"].includes(
    typeof body.persona === "string" ? body.persona : ""
  )
    ? (body.persona as CoachPersona)
    : "direct";

  const systemPrompt = await buildCoachChatContext(riotAccountId, persona);
  if (!systemPrompt) return errJson("Riot account not found", 404);

  return new Response(createCoachChatStream(systemPrompt, messages), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-RateLimit-Limit": String(dailyLimit),
    },
  });
}
