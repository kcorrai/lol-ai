import { NextRequest, NextResponse } from "next/server";
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

  const body = (await req.json().catch(() => ({}))) as { messages?: ChatMessage[]; persona?: CoachPersona };
  const messages = body.messages ?? [];
  const persona: CoachPersona = ["direct", "analytical", "motivational"].includes(body.persona ?? "")
    ? (body.persona as CoachPersona)
    : "direct";
  if (!Array.isArray(messages) || messages.length === 0) return errJson("messages array is required", 400);
  if (messages.length > 40) return errJson("Conversation too long", 400);

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
