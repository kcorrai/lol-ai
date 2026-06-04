import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getAiClient } from "@/lib/ai/client";
import { buildChatSystemPrompt } from "@/lib/ai/chatSystemPrompt";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { getPlayerPerformanceProfile } from "@/domains/analysis/services/matchAnalysisService";
import { getActivePlan } from "@/domains/analysis/services/improvementPlanService";
import { prisma } from "@/lib/db/prisma";
import type { ChatMessage } from "@/lib/ai/types";

const DAILY_LIMIT_FREE = 5;
const DAILY_LIMIT_PRO  = 50;
const DAY_MS           = 24 * 60 * 60 * 1000;

function errJson(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}

// POST /api/riot/[riotAccountId]/chat — returns text/plain stream
export async function POST(req: NextRequest): Promise<Response> {
  // Auth
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
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true },
  });
  const isPro = sub?.plan === "pro" || sub?.plan === "elite";
  const dailyLimit = isPro ? DAILY_LIMIT_PRO : DAILY_LIMIT_FREE;

  const rl = await checkRateLimit(`chat:${userId}`, { limit: dailyLimit, windowMs: DAY_MS });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Daily message limit reached. Upgrade to Pro for 50 messages/day." } },
      { status: 429 }
    );
  }

  // Parse body
  const body = await req.json().catch(() => ({})) as { messages?: ChatMessage[] };
  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    return errJson("messages array is required", 400);
  }
  if (messages.length > 40) return errJson("Conversation too long", 400);

  // Build context
  const [account, profile, plan] = await Promise.all([
    prisma.riotAccount.findUnique({
      where: { id: riotAccountId },
      select: { gameName: true, tagLine: true, region: true },
    }),
    getPlayerPerformanceProfile(riotAccountId, 20),
    getActivePlan(riotAccountId),
  ]);

  if (!account) return errJson("Riot account not found", 404);

  const latestReport = await prisma.coachingReport.findFirst({
    where: { riotAccountId, status: "complete" },
    orderBy: { completedAt: "desc" },
    select: { actionItems: true },
  });
  const actionItems = latestReport?.actionItems as Array<{ priority: number; action: string }> | null;
  const focusAction = actionItems?.sort((a, b) => a.priority - b.priority)[0]?.action ?? null;

  const rankRow = await prisma.rankedHistory.findFirst({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5" },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true },
  });
  const rankDisplay = rankRow ? `${rankRow.tier} ${rankRow.division} ${rankRow.lp} LP` : null;

  const systemPrompt = buildChatSystemPrompt({
    gameName: account.gameName,
    tagLine: account.tagLine,
    region: account.region,
    rankDisplay,
    profile,
    plan,
    focusAction,
  });

  // Stream
  const ai = getAiClient();
  const tokenStream = ai.streamChat(systemPrompt, messages);
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const token of tokenStream) {
          controller.enqueue(encoder.encode(token));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-RateLimit-Limit": String(dailyLimit),
    },
  });
}
