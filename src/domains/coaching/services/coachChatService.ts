import { prisma } from "@/lib/db/prisma";
import { getAiClient } from "@/lib/ai/client";
import { buildChatSystemPrompt, type CoachPersona } from "@/lib/ai/chatSystemPrompt";
import { getPlayerPerformanceProfile } from "@/domains/analysis/services/matchAnalysisService";
import { getActivePlan } from "@/domains/analysis/services/improvementPlanService";
import type { ChatMessage } from "@/lib/ai/types";

// Assembles the coach chat system prompt from the account's profile, active plan,
// latest report focus and current rank. Returns null when the account is missing.
export async function buildCoachChatContext(
  riotAccountId: string,
  persona: CoachPersona
): Promise<string | null> {
  const [account, profile, plan] = await Promise.all([
    prisma.riotAccount.findUnique({
      where: { id: riotAccountId },
      select: { gameName: true, tagLine: true, region: true },
    }),
    getPlayerPerformanceProfile(riotAccountId, 20),
    getActivePlan(riotAccountId),
  ]);

  if (!account) return null;

  const latestReport = await prisma.coachingReport.findFirst({
    where: { riotAccountId, status: "complete" },
    orderBy: { completedAt: "desc" },
    select: { actionItems: true },
  });
  const actionItems = latestReport?.actionItems as Array<{
    priority: number;
    action: string;
  }> | null;
  const focusAction = actionItems?.sort((a, b) => a.priority - b.priority)[0]?.action ?? null;

  const rankRow = await prisma.rankedHistory.findFirst({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5" },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true },
  });
  const rankDisplay = rankRow ? `${rankRow.tier} ${rankRow.division} ${rankRow.lp} LP` : null;

  return buildChatSystemPrompt({
    gameName: account.gameName,
    tagLine: account.tagLine,
    region: account.region,
    rankDisplay,
    profile,
    plan,
    focusAction,
    persona,
  });
}

// The whole transcript is re-billed as input on every turn, so a long conversation costs more per
// reply the longer it runs. The coach's context lives in the system prompt, not the history, so the
// last few exchanges are all a reply needs.
const MODEL_HISTORY_MESSAGES = 12;

// Keeps the recent turns, starting on a user message — Anthropic rejects a conversation that opens
// with the assistant.
export function recentChatHistory(messages: ChatMessage[]): ChatMessage[] {
  const recent = messages.slice(-MODEL_HISTORY_MESSAGES);
  const firstUser = recent.findIndex((m) => m.role === "user");
  return firstUser === -1 ? recent : recent.slice(firstUser);
}

// Streams the AI chat completion as UTF-8 text chunks.
export function createCoachChatStream(
  systemPrompt: string,
  messages: ChatMessage[]
): ReadableStream<Uint8Array> {
  const tokenStream = getAiClient("coach-chat").streamChat(
    systemPrompt,
    recentChatHistory(messages)
  );
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
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
}
