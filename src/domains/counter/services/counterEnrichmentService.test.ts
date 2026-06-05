import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/client", () => ({
  getAiClient: vi.fn(),
}));

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn().mockResolvedValue(undefined),
  buildCacheKey: vi.fn().mockReturnValue("test-enrichment-key"),
}));

import { getEnrichedStaticCounters } from "./counterEnrichmentService";
import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached } from "@/lib/ai/aiCache";
import type { StaticCounterData } from "../data/staticCounters";

const mockComplete = vi.fn();

const ENTRY_A = {
  champion: "Renekton",
  difficulty: "medium" as const,
  tier: "A" as const,
  reasonWhy: "Erken oyunda baskı kurar.",
  laneAdvantage: "W stun combo güçlü.",
  watchOut: "Ult aktivasyonuna dikkat.",
  buildHint: "Ravenous Hydra, Sterak's Gage",
};

const ENTRY_B = {
  champion: "Malphite",
  difficulty: "easy" as const,
  tier: "S" as const,
  reasonWhy: "Zırh pasifi hasarı azaltır.",
  laneAdvantage: "Pasif kalkan trade avantajı sağlar.",
  watchOut: "Ult team fight belirleyicidir.",
  buildHint: "Frozen Heart, Sunfire Aegis",
};

const STATIC_DATA: StaticCounterData = {
  topCounters: [ENTRY_A],
  easyCounters: [ENTRY_B],
  soloQueueCounters: [ENTRY_A], // duplicate of ENTRY_A — tests deduplication
  tips: ["Erken trade yap.", "Ward koy."],
  patchNote: "Manuel veri.",
};

const ENRICHMENT_FIELDS = {
  lanePhases: { early: "Strong" as const, mid: "Strong" as const, late: "Even" as const },
  runeAdvice: { keystone: "Conqueror", primaryPath: "Precision", secondaryPath: "Resolve" },
  keyItems: ["Ravenous Hydra", "Sterak's Gage", "Death's Dance"],
  winConditions: ["Erken oyunda üstünlük sağlamak", "Takım savaşlarında ön safta durmak"],
  commonMistakes: ["Akali'nin W'sunu unutmak", "Erken fazla agresif oynamak"],
};

const AI_RESPONSE = {
  enriched: [
    { champion: "Renekton", ...ENRICHMENT_FIELDS },
    { champion: "Malphite", ...ENRICHMENT_FIELDS },
  ],
};

function makeAiResponse(content: unknown) {
  return {
    content: JSON.stringify(content),
    model: "gpt-4o",
    promptTokens: 100,
    completionTokens: 200,
    totalTokens: 300,
    latencyMs: 500,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAiClient).mockReturnValue({ complete: mockComplete } as unknown as ReturnType<typeof getAiClient>);
  vi.mocked(setCached).mockResolvedValue(undefined);
});

describe("getEnrichedStaticCounters", () => {
  it("returns cached data and skips AI call on cache hit", async () => {
    const cachedData = { ...STATIC_DATA, topCounters: [{ ...ENTRY_A, ...ENRICHMENT_FIELDS }] };
    vi.mocked(getCached).mockResolvedValue(cachedData);

    const result = await getEnrichedStaticCounters("Akali", "TOP", STATIC_DATA);

    expect(mockComplete).not.toHaveBeenCalled();
    expect(result).toEqual(cachedData);
  });

  it("calls AI and writes to cache on cache miss", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(makeAiResponse(AI_RESPONSE));

    await getEnrichedStaticCounters("Akali", "TOP", STATIC_DATA);

    expect(mockComplete).toHaveBeenCalledOnce();
    expect(setCached).toHaveBeenCalledWith(
      "test-enrichment-key",
      "counter-enrichment",
      expect.any(Object),
      90
    );
  });

  it("merges enrichment fields onto matching counter entries", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(makeAiResponse(AI_RESPONSE));

    const result = await getEnrichedStaticCounters("Akali", "TOP", STATIC_DATA);

    const renekton = result.topCounters.find((e) => e.champion === "Renekton");
    expect(renekton?.lanePhases).toEqual(ENRICHMENT_FIELDS.lanePhases);
    expect(renekton?.runeAdvice).toEqual(ENRICHMENT_FIELDS.runeAdvice);
    expect(renekton?.keyItems).toEqual(ENRICHMENT_FIELDS.keyItems);
    expect(renekton?.winConditions).toEqual(ENRICHMENT_FIELDS.winConditions);
    expect(renekton?.commonMistakes).toEqual(ENRICHMENT_FIELDS.commonMistakes);
  });

  it("preserves original fields alongside enriched ones", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(makeAiResponse(AI_RESPONSE));

    const result = await getEnrichedStaticCounters("Akali", "TOP", STATIC_DATA);

    const renekton = result.topCounters.find((e) => e.champion === "Renekton");
    expect(renekton?.reasonWhy).toBe(ENTRY_A.reasonWhy);
    expect(renekton?.laneAdvantage).toBe(ENTRY_A.laneAdvantage);
    expect(renekton?.tier).toBe(ENTRY_A.tier);
  });

  it("enriches entries across all three lists", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(makeAiResponse(AI_RESPONSE));

    const result = await getEnrichedStaticCounters("Akali", "TOP", STATIC_DATA);

    const inEasy = result.easyCounters.find((e) => e.champion === "Malphite");
    const inSoloQ = result.soloQueueCounters.find((e) => e.champion === "Renekton");
    expect(inEasy?.lanePhases).toBeDefined();
    expect(inSoloQ?.lanePhases).toBeDefined();
  });

  it("deduplicates entries before calling AI (same champ in top + soloQueue)", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(makeAiResponse(AI_RESPONSE));

    await getEnrichedStaticCounters("Akali", "TOP", STATIC_DATA);

    const prompt: string = mockComplete.mock.calls[0][1];
    const renektonCount = (prompt.match(/Renekton/g) ?? []).length;
    expect(renektonCount).toBe(1);
  });

  it("falls back to static data when AI returns invalid JSON", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue({ ...makeAiResponse(null), content: "not json at all" });

    const result = await getEnrichedStaticCounters("Akali", "TOP", STATIC_DATA);

    expect(result).toEqual(STATIC_DATA);
    expect(setCached).not.toHaveBeenCalled();
  });

  it("falls back to static data when AI response fails schema validation", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    mockComplete.mockResolvedValue(makeAiResponse({ wrong: "shape" }));

    const result = await getEnrichedStaticCounters("Akali", "TOP", STATIC_DATA);

    expect(result).toEqual(STATIC_DATA);
    expect(setCached).not.toHaveBeenCalled();
  });

  it("leaves entries with no enrichment match unchanged", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    // AI returns enrichment only for Malphite, not Renekton
    mockComplete.mockResolvedValue(
      makeAiResponse({ enriched: [{ champion: "Malphite", ...ENRICHMENT_FIELDS }] })
    );

    const result = await getEnrichedStaticCounters("Akali", "TOP", STATIC_DATA);

    const renekton = result.topCounters.find((e) => e.champion === "Renekton");
    expect(renekton?.lanePhases).toBeUndefined();
    expect(renekton?.reasonWhy).toBe(ENTRY_A.reasonWhy);
  });
});
