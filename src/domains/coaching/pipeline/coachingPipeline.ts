import { createHash } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getAiClient } from "@/lib/ai/client";
import { parseCoachingResponse } from "@/lib/ai/responseParser";
import { buildCoachingInput } from "@/domains/coaching/pipeline/dataPreparator";
import { buildPrompt } from "@/domains/coaching/pipeline/promptBuilder";
import type { ReportType } from "@prisma/client";

function hashPrompt(systemPrompt: string, userMessage: string): string {
  return createHash("sha256")
    .update(systemPrompt + userMessage)
    .digest("hex")
    .slice(0, 32);
}

export async function runCoachingPipeline(
  reportId: string,
  riotAccountId: string,
  matchIds: string[],
  reportType: ReportType,
  focusArea?: string
): Promise<void> {
  await prisma.coachingReport.update({
    where: { id: reportId },
    data: { status: "processing" },
  });

  try {
    const input = await buildCoachingInput(riotAccountId, matchIds, focusArea);
    const { systemPrompt, userMessage } = buildPrompt(input, reportType);
    const inputHash = hashPrompt(systemPrompt, userMessage);

    // Dedup: reuse a prior AI response if the exact same prompt was already processed
    const cached = await prisma.aiAnalysis.findUnique({ where: { inputHash } });

    let rawContent: string;
    let model: string;
    let promptTokens: number;
    let completionTokens: number;
    let totalTokens: number;
    let latencyMs: number;
    let cacheHit: boolean;

    if (cached) {
      rawContent = cached.responseRaw;
      model = cached.model;
      promptTokens = cached.promptTokens;
      completionTokens = cached.completionTokens;
      totalTokens = cached.totalTokens;
      latencyMs = 0;
      cacheHit = true;
    } else {
      const result = await getAiClient().complete(systemPrompt, userMessage);
      rawContent = result.content;
      model = result.model;
      promptTokens = result.promptTokens;
      completionTokens = result.completionTokens;
      totalTokens = result.totalTokens;
      latencyMs = result.latencyMs;
      cacheHit = false;

      await prisma.aiAnalysis.create({
        data: {
          coachingReportId: reportId,
          analysisType: reportType,
          inputHash,
          provider: process.env.AI_PROVIDER ?? "openai",
          model,
          promptTokens,
          completionTokens,
          totalTokens,
          responseRaw: rawContent,
          latencyMs,
          cacheHit: false,
        },
      });
    }

    const parsed = parseCoachingResponse(rawContent);

    await prisma.coachingReport.update({
      where: { id: reportId },
      data: {
        status: "complete",
        summary: parsed.summary,
        strengths: parsed.strengths,
        weaknesses: parsed.weaknesses,
        actionItems: parsed.actionItems,
        championRecommendations: parsed.championRecommendations ?? undefined,
        estimatedRankPotential: parsed.estimatedRankPotential ?? undefined,
        coachPersonaResponse: parsed.coachPersonaResponse,
        aiModelUsed: model,
        processingTimeMs: latencyMs,
        completedAt: new Date(),
      },
    });

    logger.info("Coaching pipeline complete", { reportId, cacheHit, totalTokens, latencyMs });
  } catch (error) {
    logger.error("Coaching pipeline failed", { reportId, error });
    Sentry.captureException(error, { extra: { reportId } });
    await prisma.coachingReport.update({
      where: { id: reportId },
      data: { status: "failed" },
    });
  }
}
