import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/client", () => ({
  getAiClient: vi.fn(),
}));

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn().mockResolvedValue(undefined),
  buildCacheKey: vi.fn().mockReturnValue("test-cache-key"),
}));

import { getMatchupAnalysis } from "./matchupAnalysisService";
import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached } from "@/lib/ai/aiCache";

const mockComplete = vi.fn();

const validAiResponse = {
  laneAnalysis: {
    advantage: "favorable",
    summary: "Yasuo has the edge with mobility",
    levels1to3: "Play safe, farm under tower",
    level6Plan: "All-in at 6 with R",
    powerSpikes: [{ level: 6, description: "R available" }],
  },
  tradeGuide: {
    shortTrade: { scenario: "Quick EQ combo", advantage: "you", tip: "Trade after E" },
    longTrade: { scenario: "Extended all-in", advantage: "opponent", tip: "Avoid long trades" },
    winConditions: ["Win at 6", "Roam after pushing"],
    loseConditions: ["Falling behind in CS", "Losing early trades"],
  },
  buildAdvice: {
    startingItems: ["Long Sword", "Refillable Potion"],
    coreItems: ["Trinity Force", "Immortal Shieldbow"],
    situationalItems: ["Wit's End"],
    reasoning: "Trinity Force for early power spike",
  },
  criticalMistakes: {
    avoidTrades: ["Trading during W downtime"],
    riskyTimings: ["Level 1-2 all-in"],
    keyMistakes: ["Overextending without vision"],
  },
  patchNote: "Bu analiz AI tarafından üretilmiştir. Güncel patch verilerini yansıtmayabilir.",
};

const validCachedResult = {
  champion: "Yasuo",
  opponent: "Zed",
  role: "MIDDLE" as const,
  ...validAiResponse,
  generatedAt: "2026-06-05T00:00:00.000Z",
};

const AI_RESULT = { content: JSON.stringify(validAiResponse), model: "gpt-4o", promptTokens: 200, completionTokens: 400, totalTokens: 600, latencyMs: 800 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAiClient).mockReturnValue({ complete: mockComplete } as unknown as ReturnType<typeof getAiClient>);
  vi.mocked(setCached).mockResolvedValue(undefined);
});

describe("getMatchupAnalysis", () => {
  it("returns MatchupAnalysis with all fields for valid inputs", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(AI_RESULT);

    const result = await getMatchupAnalysis("Yasuo", "Zed", "MIDDLE");

    expect(result.champion).toBe("Yasuo");
    expect(result.opponent).toBe("Zed");
    expect(result.role).toBe("MIDDLE");
    expect(result.laneAnalysis).toBeDefined();
    expect(result.tradeGuide).toBeDefined();
    expect(result.buildAdvice).toBeDefined();
    expect(result.criticalMistakes).toBeDefined();
    expect(result.generatedAt).toBeDefined();
  });

  it("does not call aiClient.complete on cache hit", async () => {
    vi.mocked(getCached).mockResolvedValue(validCachedResult);

    const result = await getMatchupAnalysis("Yasuo", "Zed", "MIDDLE");

    expect(mockComplete).not.toHaveBeenCalled();
    expect(result.champion).toBe("Yasuo");
  });

  it("calls aiClient.complete and setCached on cache miss", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(AI_RESULT);

    await getMatchupAnalysis("Yasuo", "Zed", "MIDDLE");

    expect(mockComplete).toHaveBeenCalledOnce();
    expect(setCached).toHaveBeenCalledWith(
      "test-cache-key",
      "matchup",
      expect.objectContaining({ champion: "Yasuo", opponent: "Zed" }),
      14
    );
  });

  it("throws when champion and opponent are the same", async () => {
    await expect(getMatchupAnalysis("Yasuo", "Yasuo", "MIDDLE")).rejects.toThrow(
      "İki farklı şampiyon seçilmelidir"
    );
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it("throws on malformed JSON from AI", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue({ content: "not valid json!!!", model: "gpt-4o", promptTokens: 10, completionTokens: 5, totalTokens: 15, latencyMs: 100 });

    await expect(getMatchupAnalysis("Yasuo", "Zed", "MIDDLE")).rejects.toThrow(
      "Matchup AI response is not valid JSON"
    );
  });

  it("propagates error when aiClient.complete throws", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockRejectedValue(new Error("AI service down"));

    await expect(getMatchupAnalysis("Yasuo", "Zed", "MIDDLE")).rejects.toThrow("AI service down");
  });
});
