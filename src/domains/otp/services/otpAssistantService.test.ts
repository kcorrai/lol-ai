import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/client", () => ({
  getAiClient: vi.fn(),
}));

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn().mockResolvedValue(undefined),
  buildCacheKey: vi.fn().mockReturnValue("test-otp-key"),
}));

import { getOtpAnalysis } from "./otpAssistantService";
import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached } from "@/lib/ai/aiCache";

const mockComplete = vi.fn();

const MATCHUP_ENTRY = (opponent: string) => ({
  opponent,
  difficulty: "easy" as const,
  summary: "Strong lane",
  keyTip: "Trade at level 3",
});

const validAiResponse = {
  matchupTierList: {
    easy: [MATCHUP_ENTRY("Garen"), MATCHUP_ENTRY("Malphite"), MATCHUP_ENTRY("Nasus")],
    medium: [MATCHUP_ENTRY("Darius"), MATCHUP_ENTRY("Camille"), MATCHUP_ENTRY("Renekton")],
    hard: [MATCHUP_ENTRY("Fiora"), MATCHUP_ENTRY("Irelia"), MATCHUP_ENTRY("Vayne")],
  },
  banPriority: [
    { champion: "Fiora", priority: 1 as const, reason: "Hard counter" },
    { champion: "Irelia", priority: 2 as const, reason: "Slippery" },
    { champion: "Vayne", priority: 3 as const, reason: "Scales well" },
  ],
  hiddenMechanics: [
    "E cancel animation to trade",
    "Q through minion wave to poke",
    "Flash Q combo",
  ],
  powerSpikes: [
    { trigger: "Level 6", description: "All-in power spike" },
    { trigger: "Triforce", description: "Massive damage boost" },
    { trigger: "Sterak's Gage", description: "Survive burst damage" },
    { trigger: "Level 9", description: "Q max complete" },
  ],
  laneStrategies: [
    "Trade when E is off cooldown",
    "Push wave before backing",
  ],
  metaRating: {
    score: 7,
    assessment: "Güçlü",
    reasoning: "Strong in current meta",
    patchContext: "No changes in patch 14.10",
  },
};

const mockAiMessage = {
  content: JSON.stringify(validAiResponse),
  model: "gpt-4o",
  promptTokens: 100,
  completionTokens: 200,
  totalTokens: 300,
  latencyMs: 500,
};

const validCachedResult = {
  champion: "Yasuo",
  role: "MIDDLE" as const,
  ...validAiResponse,
  generatedAt: "2026-06-05T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAiClient).mockReturnValue({
    complete: mockComplete,
  } as unknown as ReturnType<typeof getAiClient>);
  vi.mocked(setCached).mockResolvedValue(undefined);
});

describe("getOtpAnalysis", () => {
  it("returns OtpAnalysis with all fields for Yasuo Mid", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(mockAiMessage);

    const result = await getOtpAnalysis("Yasuo", "MIDDLE");

    expect(result.champion).toBe("Yasuo");
    expect(result.role).toBe("MIDDLE");
    expect(result.matchupTierList.easy).toHaveLength(3);
    expect(result.matchupTierList.medium).toHaveLength(3);
    expect(result.matchupTierList.hard).toHaveLength(3);
    expect(result.banPriority).toHaveLength(3);
    expect(result.hiddenMechanics.length).toBeGreaterThanOrEqual(2);
    expect(result.powerSpikes.length).toBeGreaterThanOrEqual(3);
    expect(result.metaRating.score).toBe(7);
    expect(result.generatedAt).toBeDefined();
  });

  it("does not call aiClient.complete on cache hit", async () => {
    vi.mocked(getCached).mockResolvedValue(validCachedResult);

    const result = await getOtpAnalysis("Yasuo", "MIDDLE");

    expect(mockComplete).not.toHaveBeenCalled();
    expect(result.champion).toBe("Yasuo");
  });

  it("calls aiClient.complete and setCached on cache miss", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(mockAiMessage);

    await getOtpAnalysis("Yasuo", "MIDDLE");

    expect(mockComplete).toHaveBeenCalledOnce();
    expect(setCached).toHaveBeenCalledWith(
      "test-otp-key",
      "otp",
      expect.objectContaining({ champion: "Yasuo", role: "MIDDLE" }),
      14
    );
  });

  it("throws on malformed JSON from AI", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue({
      content: "not json at all !!",
      model: "gpt-4o",
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
      latencyMs: 100,
    });

    await expect(getOtpAnalysis("Yasuo", "MIDDLE")).rejects.toThrow(
      "OTP AI response is not valid JSON"
    );
  });

  it("throws ZodError when matchupTierList has fewer than 3 entries in a tier", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    const invalid = {
      ...validAiResponse,
      matchupTierList: {
        ...validAiResponse.matchupTierList,
        easy: [MATCHUP_ENTRY("Garen"), MATCHUP_ENTRY("Malphite")],
      },
    };
    mockComplete.mockResolvedValue({ ...mockAiMessage, content: JSON.stringify(invalid) });

    await expect(getOtpAnalysis("Yasuo", "MIDDLE")).rejects.toThrow();
  });

  it("throws ZodError when metaRating.score is out of range", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    const invalid = {
      ...validAiResponse,
      metaRating: { ...validAiResponse.metaRating, score: 11 },
    };
    mockComplete.mockResolvedValue({ ...mockAiMessage, content: JSON.stringify(invalid) });

    await expect(getOtpAnalysis("Yasuo", "MIDDLE")).rejects.toThrow();
  });
});
