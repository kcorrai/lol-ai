import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/client", () => ({
  getAiClient: vi.fn(),
}));

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn().mockResolvedValue(undefined),
  buildCacheKey: vi.fn().mockReturnValue("test-draft-key"),
}));

import { analyzeDraft } from "./draftAnalysisService";
import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached } from "@/lib/ai/aiCache";

const mockComplete = vi.fn();

const BLUE_TEAM = {
  TOP: "Garen",
  JUNGLE: "LeeSin",
  MIDDLE: "Yasuo",
  BOTTOM: "Jinx",
  UTILITY: "Thresh",
};

const RED_TEAM = {
  TOP: "Darius",
  JUNGLE: "Vi",
  MIDDLE: "Zed",
  BOTTOM: "Caitlyn",
  UTILITY: "Lulu",
};

function makeComposition(score = 7) {
  return {
    engagePower: score,
    disengagePower: score,
    teamfightPower: score,
    pickPotential: score,
    splitPushPower: score,
    summary: "Strong composition",
  };
}

function makeScaling(score = 7) {
  return {
    earlyGame: { score, description: "Strong early" },
    midGame: { score, description: "Strong mid" },
    lateGame: { score, description: "Strong late" },
  };
}

const validAiResponse = {
  blueTeamComposition: makeComposition(),
  redTeamComposition: makeComposition(6),
  blueWinConditions: [{ description: "Teamfight", priority: "primary" as const, howToAchieve: "Group mid" }],
  redWinConditions: [{ description: "Split push", priority: "primary" as const, howToAchieve: "Split with Darius" }],
  blueScaling: makeScaling(),
  redScaling: makeScaling(5),
  keyMatchups: [{ blue: "Yasuo", red: "Zed", advantage: "even" as const, note: "Both assassins" }],
  risks: [{ team: "blue" as const, risk: "Poke vulnerable", severity: "medium" as const }],
  verdict: "Blue team has better teamfight potential.",
};

const mockAiMsg = {
  content: JSON.stringify(validAiResponse),
  model: "gpt-4o",
  promptTokens: 100,
  completionTokens: 200,
  totalTokens: 300,
  latencyMs: 500,
};

const validCachedResult = {
  blueTeam: BLUE_TEAM,
  redTeam: RED_TEAM,
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

describe("analyzeDraft", () => {
  it("returns DraftAnalysis with all fields for valid 10 champions", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(mockAiMsg);

    const result = await analyzeDraft({ blueTeam: BLUE_TEAM, redTeam: RED_TEAM });

    expect(result.blueTeam.TOP).toBe("Garen");
    expect(result.redTeam.TOP).toBe("Darius");
    expect(result.blueTeamComposition.engagePower).toBe(7);
    expect(result.blueWinConditions).toHaveLength(1);
    expect(result.keyMatchups).toHaveLength(1);
    expect(result.verdict).toBeTruthy();
    expect(result.generatedAt).toBeDefined();
  });

  it("does not call aiClient.complete on cache hit", async () => {
    vi.mocked(getCached).mockResolvedValue(validCachedResult);

    const result = await analyzeDraft({ blueTeam: BLUE_TEAM, redTeam: RED_TEAM });

    expect(mockComplete).not.toHaveBeenCalled();
    expect(result.verdict).toBeTruthy();
  });

  it("calls aiClient.complete and setCached on cache miss", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(mockAiMsg);

    await analyzeDraft({ blueTeam: BLUE_TEAM, redTeam: RED_TEAM });

    expect(mockComplete).toHaveBeenCalledOnce();
    expect(setCached).toHaveBeenCalledWith(
      "test-draft-key",
      "draft",
      expect.objectContaining({ verdict: expect.any(String) }),
      7
    );
  });

  it("throws when champion appears in both teams (duplicate)", async () => {
    const duplicateBlue = { ...BLUE_TEAM, TOP: "Darius" };
    await expect(
      analyzeDraft({ blueTeam: duplicateBlue, redTeam: RED_TEAM })
    ).rejects.toThrow("yalnızca bir kez");
  });

  it("throws when a position is missing (empty string)", async () => {
    const incomplete = { ...BLUE_TEAM, TOP: "" };
    await expect(
      analyzeDraft({ blueTeam: incomplete, redTeam: RED_TEAM })
    ).rejects.toThrow("TOP");
  });

  it("throws on malformed JSON from AI", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue({ ...mockAiMsg, content: "not json !!" });

    await expect(analyzeDraft({ blueTeam: BLUE_TEAM, redTeam: RED_TEAM })).rejects.toThrow(
      "Draft AI response is not valid JSON"
    );
  });

  it("throws ZodError when TeamComposition score is out of range", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    const invalid = {
      ...validAiResponse,
      blueTeamComposition: { ...makeComposition(), engagePower: 15 },
    };
    mockComplete.mockResolvedValue({ ...mockAiMsg, content: JSON.stringify(invalid) });

    await expect(analyzeDraft({ blueTeam: BLUE_TEAM, redTeam: RED_TEAM })).rejects.toThrow();
  });
});
