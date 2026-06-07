import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeDraft } from "@/domains/draft/services/draftAnalysisService";
import type { DraftInput } from "@/domains/draft/types/draft.types";

vi.mock("@/lib/ai/client", () => ({
  getAiClient: vi.fn(() => ({ complete: vi.fn() })),
}));

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn(),
  buildCacheKey: vi.fn(() => "test-key"),
}));

import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached } from "@/lib/ai/aiCache";

const validInput: DraftInput = {
  blueTeam: { TOP: "Garen", JUNGLE: "Hecarim", MIDDLE: "Ahri", BOTTOM: "Jinx", UTILITY: "Leona" },
  redTeam:  { TOP: "Fiora", JUNGLE: "Lee Sin", MIDDLE: "Zed",  BOTTOM: "Ezreal", UTILITY: "Thresh" },
};

const scalingPhase = { score: 7, description: "Strong" };
const teamComp = { engagePower: 7, disengagePower: 4, teamfightPower: 8, pickPotential: 5, splitPushPower: 3, summary: "Engage ağırlıklı" };

const validAiJson = JSON.stringify({
  blueTeamComposition: teamComp,
  redTeamComposition: { ...teamComp, summary: "Split push ağırlıklı" },
  blueWinConditions: [{ description: "Teamfight", priority: "primary", howToAchieve: "Group and fight", phase: "mid" }],
  redWinConditions: [{ description: "Split push", priority: "primary", howToAchieve: "Side lanes" }],
  blueScaling: { earlyGame: scalingPhase, midGame: scalingPhase, lateGame: scalingPhase },
  redScaling: { earlyGame: scalingPhase, midGame: scalingPhase, lateGame: scalingPhase },
  keyMatchups: [{ blue: "Garen", red: "Fiora", advantage: "red", note: "Fiora outscales", microTip: "Don't split" }],
  risks: [{ team: "blue", risk: "Can be kited", severity: "medium" }],
  banRecommendations: [{ champion: "Lee Sin", targetTeam: "red", reason: "High pressure" }],
  verdict: "Mavi takım geç oyunda avantajlı",
});

describe("analyzeDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCached).mockResolvedValue(null);
    const mockComplete = vi.fn().mockResolvedValue({
      content: validAiJson,
      model: "test", promptTokens: 0, completionTokens: 0, totalTokens: 0, latencyMs: 0,
    });
    vi.mocked(getAiClient).mockReturnValue({ complete: mockComplete } as never);
  });

  it("returns a DraftAnalysis with blueTeam picks preserved", async () => {
    const result = await analyzeDraft(validInput);
    expect(result.blueTeam.TOP).toBe("Garen");
    expect(result.verdict).toBe("Mavi takım geç oyunda avantajlı");
  });

  it("includes generatedAt timestamp", async () => {
    const result = await analyzeDraft(validInput);
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns cached result without calling AI on cache hit", async () => {
    const cachedData = {
      blueTeam: validInput.blueTeam,
      redTeam: validInput.redTeam,
      ...JSON.parse(validAiJson),
      generatedAt: new Date().toISOString(),
    };
    vi.mocked(getCached).mockResolvedValue(cachedData);
    const result = await analyzeDraft(validInput);
    expect(result).toBeDefined();
    expect(getAiClient).not.toHaveBeenCalled();
  });

  it("saves result to cache after AI call", async () => {
    await analyzeDraft(validInput);
    expect(setCached).toHaveBeenCalledOnce();
  });

  it("throws when a position is empty in blueTeam", async () => {
    const bad: DraftInput = { ...validInput, blueTeam: { ...validInput.blueTeam, TOP: "" } };
    await expect(analyzeDraft(bad)).rejects.toThrow("TOP");
  });

  it("throws when the same champion appears on both teams", async () => {
    const bad: DraftInput = { ...validInput, redTeam: { ...validInput.redTeam, TOP: "Garen" } };
    await expect(analyzeDraft(bad)).rejects.toThrow();
  });
});
