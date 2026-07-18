import { describe, it, expect, vi, beforeEach } from "vitest";

// Must be declared before the module is imported
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coachingReport: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    aiAnalysis: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/analytics/posthog", () => ({
  capture: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/ai/client", () => ({
  getAiClient: vi.fn(),
}));

vi.mock("@/domains/coaching/pipeline/dataPreparator", () => ({
  buildCoachingInput: vi.fn(),
}));

vi.mock("@/domains/coaching/pipeline/promptBuilder", () => ({
  buildPrompt: vi.fn(),
}));

vi.mock("@/lib/ai/responseParser", () => ({
  parseCoachingResponse: vi.fn(),
}));

import { runCoachingPipeline } from "./coachingPipeline";
import { prisma } from "@/lib/db/prisma";
import { getAiClient } from "@/lib/ai/client";
import { buildCoachingInput } from "@/domains/coaching/pipeline/dataPreparator";
import { buildPrompt } from "@/domains/coaching/pipeline/promptBuilder";
import { parseCoachingResponse } from "@/lib/ai/responseParser";

const mockPrisma = prisma as unknown as {
  coachingReport: { update: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  aiAnalysis: { findUnique: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> };
};

const REPORT_ID = "report-uuid-001";
const ACCOUNT_ID = "account-uuid-001";
const MATCH_IDS = ["match-001", "match-002"];

const mockParsedOutput = {
  summary: "Solid macro, weak micro.",
  strengths: [{ area: "Vision", description: "Good warding.", evidence: "VS: 35" }],
  weaknesses: [{ area: "CS", description: "Low.", priority: "high", evidence: "5.1/min" }],
  actionItems: [
    { priority: 1, action: "CS", howTo: "Practice", expectedImpact: "+1/min", timeframe: "2w" },
    { priority: 2, action: "Ward", howTo: "Buy pinks", expectedImpact: "Vision", timeframe: "Now" },
    { priority: 3, action: "Recall", howTo: "Full gold", expectedImpact: "Items", timeframe: "1w" },
  ],
  coachPersonaResponse: "Focus on fundamentals.",
};

describe("runCoachingPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AI_PROVIDER = "openai";

    (buildCoachingInput as ReturnType<typeof vi.fn>).mockResolvedValue({ player: {} });
    (buildPrompt as ReturnType<typeof vi.fn>).mockReturnValue({
      systemPrompt: "sys",
      userMessage: "user",
    });
    (parseCoachingResponse as ReturnType<typeof vi.fn>).mockReturnValue(mockParsedOutput);
    mockPrisma.coachingReport.update.mockResolvedValue({});
    mockPrisma.coachingReport.findUnique.mockResolvedValue({ riotAccount: { userId: "user-1" } });
    mockPrisma.aiAnalysis.findUnique.mockResolvedValue(null);
    mockPrisma.aiAnalysis.upsert.mockResolvedValue({});
  });

  it("marks report as processing then complete on success", async () => {
    const mockComplete = vi.fn().mockResolvedValue({
      content: "{}",
      model: "gpt-4o",
      promptTokens: 500,
      completionTokens: 400,
      totalTokens: 900,
      latencyMs: 1200,
    });
    (getAiClient as ReturnType<typeof vi.fn>).mockReturnValue({ complete: mockComplete });

    await runCoachingPipeline(REPORT_ID, ACCOUNT_ID, MATCH_IDS, "session_review");

    expect(mockPrisma.coachingReport.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: { status: "processing" } })
    );
    expect(mockPrisma.coachingReport.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: expect.objectContaining({ status: "complete" }) })
    );
  });

  it("creates an AiAnalysis record on a cache miss", async () => {
    mockPrisma.aiAnalysis.findUnique.mockResolvedValue(null);
    const mockComplete = vi.fn().mockResolvedValue({
      content: "{}",
      model: "gpt-4o",
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300,
      latencyMs: 800,
    });
    (getAiClient as ReturnType<typeof vi.fn>).mockReturnValue({ complete: mockComplete });

    await runCoachingPipeline(REPORT_ID, ACCOUNT_ID, MATCH_IDS, "session_review");

    expect(mockPrisma.aiAnalysis.upsert).toHaveBeenCalledOnce();
  });

  it("skips AI call on a cache hit", async () => {
    const cachedAnalysis = {
      responseRaw: JSON.stringify(mockParsedOutput),
      model: "gpt-4o",
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300,
      latencyMs: 800,
    };
    mockPrisma.aiAnalysis.findUnique.mockResolvedValue(cachedAnalysis);
    const mockComplete = vi.fn();
    (getAiClient as ReturnType<typeof vi.fn>).mockReturnValue({ complete: mockComplete });

    await runCoachingPipeline(REPORT_ID, ACCOUNT_ID, MATCH_IDS, "session_review");

    expect(mockComplete).not.toHaveBeenCalled();
    expect(mockPrisma.aiAnalysis.upsert).not.toHaveBeenCalled();
  });

  it("marks report as failed when AI call throws", async () => {
    const mockComplete = vi.fn().mockRejectedValue(new Error("OpenAI timeout"));
    (getAiClient as ReturnType<typeof vi.fn>).mockReturnValue({ complete: mockComplete });

    await runCoachingPipeline(REPORT_ID, ACCOUNT_ID, MATCH_IDS, "session_review");

    expect(mockPrisma.coachingReport.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { status: "failed" } })
    );
  });

  it("marks report as failed when response parsing fails", async () => {
    const mockComplete = vi.fn().mockResolvedValue({
      content: "not json",
      model: "gpt-4o",
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      latencyMs: 500,
    });
    (getAiClient as ReturnType<typeof vi.fn>).mockReturnValue({ complete: mockComplete });
    (parseCoachingResponse as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("Invalid JSON");
    });

    await runCoachingPipeline(REPORT_ID, ACCOUNT_ID, MATCH_IDS, "session_review");

    expect(mockPrisma.coachingReport.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { status: "failed" } })
    );
  });
});
