import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/client", () => ({
  getAiClient: vi.fn(),
}));

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn().mockResolvedValue(undefined),
  buildCacheKey: vi.fn().mockReturnValue("test-cache-key"),
}));

import { getGeneralCounters } from "./generalCounterService";
import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached } from "@/lib/ai/aiCache";

const mockComplete = vi.fn();

const COUNTER_ENTRY = {
  champion: "Malphite",
  difficulty: "easy" as const,
  reasonWhy: "Strong against AD champions",
  laneAdvantage: "Takes minimal damage from Yasuo Q",
  watchOut: "Watch out for jungle ganks early",
  buildHint: "Rush Sunfire Cape into full tank",
  tier: "S" as const,
};

const validAiResponse = {
  topCounters: [COUNTER_ENTRY],
  easyCounters: [{ ...COUNTER_ENTRY, tier: "A" as const }],
  soloQueueCounters: [{ ...COUNTER_ENTRY, difficulty: "medium" as const, tier: "A" as const }],
  tips: ["Play safe early", "Teamfight at level 6"],
  patchNote: "Bu analiz AI tarafından üretilmiştir. Güncel patch verilerini yansıtmayabilir.",
};

const validCachedResult = {
  champion: "Yasuo",
  role: "MIDDLE" as const,
  ...validAiResponse,
  generatedAt: "2026-06-05T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAiClient).mockReturnValue({ complete: mockComplete } as ReturnType<typeof getAiClient>);
  vi.mocked(setCached).mockResolvedValue(undefined);
});

describe("getGeneralCounters", () => {
  it("returns GeneralCounterResult for valid champion and role", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue({ content: JSON.stringify(validAiResponse), model: "gpt-4o", promptTokens: 100, completionTokens: 200, totalTokens: 300, latencyMs: 500 });

    const result = await getGeneralCounters("Yasuo", "MIDDLE");

    expect(result.champion).toBe("Yasuo");
    expect(result.role).toBe("MIDDLE");
    expect(result.topCounters).toHaveLength(1);
    expect(result.generatedAt).toBeDefined();
    expect(result.patchNote).toBeTruthy();
  });

  it("does not call aiClient.complete on cache hit", async () => {
    vi.mocked(getCached).mockResolvedValue(validCachedResult);

    const result = await getGeneralCounters("Yasuo", "MIDDLE");

    expect(mockComplete).not.toHaveBeenCalled();
    expect(result.champion).toBe("Yasuo");
  });

  it("calls aiClient.complete and setCached on cache miss", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue({ content: JSON.stringify(validAiResponse), model: "gpt-4o", promptTokens: 100, completionTokens: 200, totalTokens: 300, latencyMs: 500 });

    await getGeneralCounters("Yasuo", "MIDDLE");

    expect(mockComplete).toHaveBeenCalledOnce();
    expect(setCached).toHaveBeenCalledWith(
      "test-cache-key",
      "counter-general",
      expect.objectContaining({ champion: "Yasuo", role: "MIDDLE" }),
      14
    );
  });

  it("propagates error when aiClient.complete throws", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockRejectedValue(new Error("AI unavailable"));

    await expect(getGeneralCounters("Yasuo", "MIDDLE")).rejects.toThrow("AI unavailable");
  });

  it("throws on malformed JSON from AI", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue({ content: "not valid json at all !!!", model: "gpt-4o", promptTokens: 10, completionTokens: 5, totalTokens: 15, latencyMs: 100 });

    await expect(getGeneralCounters("Yasuo", "MIDDLE")).rejects.toThrow(
      "Counter AI response is not valid JSON"
    );
  });

  it("throws ZodError when AI response does not match schema", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue({ content: JSON.stringify({ unexpected: "shape" }), model: "gpt-4o", promptTokens: 10, completionTokens: 5, totalTokens: 15, latencyMs: 100 });

    await expect(getGeneralCounters("Yasuo", "MIDDLE")).rejects.toThrow();
  });

  it("uses fallback patchNote when AI omits the field", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    const responseWithoutPatchNote = { ...validAiResponse };
    delete (responseWithoutPatchNote as Partial<typeof validAiResponse>).patchNote;
    mockComplete.mockResolvedValue({ content: JSON.stringify(responseWithoutPatchNote), model: "gpt-4o", promptTokens: 100, completionTokens: 200, totalTokens: 300, latencyMs: 500 });

    const result = await getGeneralCounters("Yasuo", "MIDDLE");

    expect(result.patchNote).toContain("AI tarafından üretilmiştir");
  });
});
