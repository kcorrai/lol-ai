import { createHash } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getAiClient } from "@/lib/ai/client";
import { parseCoachingResponse } from "@/lib/ai/responseParser";
import { buildCoachingInput } from "@/domains/coaching/pipeline/dataPreparator";
import { buildPrompt } from "@/domains/coaching/pipeline/promptBuilder";
import { capture } from "@/lib/analytics/posthog";
import type { ReportType } from "@prisma/client";

const STRICT_JSON_SUFFIX =
  "\n\nIMPORTANT: Your previous response could not be parsed as valid JSON. " +
  "Reply ONLY with a valid JSON object matching the exact schema — no markdown, no code fences, no explanation.";

function hashPrompt(systemPrompt: string, userMessage: string): string {
  return createHash("sha256")
    .update(systemPrompt + userMessage)
    .digest("hex")
    .slice(0, 32);
}

async function callAiAndPersist(
  reportId: string,
  reportType: ReportType,
  systemPrompt: string,
  userMessage: string,
  analysisTypeSuffix: string = ""
): Promise<{
  rawContent: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}> {
  const result = await getAiClient().complete(systemPrompt, userMessage);
  const {
    content: rawContent,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    latencyMs,
  } = result;

  const inputHash = hashPrompt(systemPrompt, userMessage);
  await prisma.aiAnalysis.upsert({
    where: { inputHash },
    create: {
      coachingReportId: reportId,
      analysisType: `${reportType}${analysisTypeSuffix}`,
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
    update: {
      responseRaw: rawContent,
      latencyMs,
    },
  });

  return { rawContent, model, promptTokens, completionTokens, totalTokens, latencyMs };
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
    let totalTokens: number;
    let latencyMs: number;
    let cacheHit: boolean;

    if (cached) {
      rawContent = cached.responseRaw;
      model = cached.model;
      totalTokens = cached.totalTokens;
      latencyMs = 0;
      cacheHit = true;
    } else {
      const r = await callAiAndPersist(reportId, reportType, systemPrompt, userMessage);
      rawContent = r.rawContent;
      model = r.model;
      totalTokens = r.totalTokens;
      latencyMs = r.latencyMs;
      cacheHit = false;
    }

    // Parse with one retry on malformed JSON or schema mismatch
    let parsed: ReturnType<typeof parseCoachingResponse>;
    try {
      parsed = parseCoachingResponse(rawContent);
    } catch (parseErr) {
      logger.warn("Coaching parse failed — retrying with stricter prompt", { reportId, parseErr });
      Sentry.captureMessage("Coaching parse failed — retrying", {
        level: "warning",
        extra: { reportId, error: String(parseErr) },
      });

      const retryMessage = userMessage + STRICT_JSON_SUFFIX;
      const retryResult = await callAiAndPersist(
        reportId,
        reportType,
        systemPrompt,
        retryMessage,
        "-retry"
      );
      rawContent = retryResult.rawContent;
      model = retryResult.model;
      totalTokens += retryResult.totalTokens;
      latencyMs += retryResult.latencyMs;

      parsed = parseCoachingResponse(rawContent); // throws → caught below → status: failed
    }

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

    const reportRow = await prisma.coachingReport.findUnique({
      where: { id: reportId },
      select: { riotAccount: { select: { userId: true } } },
    });
    if (reportRow?.riotAccount.userId) {
      capture(reportRow.riotAccount.userId, "report_generated", {
        reportId,
        reportType,
        cacheHit,
        totalTokens,
        latencyMs,
        model,
      }).catch(() => undefined);
    }
  } catch (error) {
    logger.error("Coaching pipeline failed", { reportId, error });
    Sentry.captureException(error, { extra: { reportId } });
    await prisma.coachingReport.update({
      where: { id: reportId },
      data: { status: "failed" },
    });
  }
}
