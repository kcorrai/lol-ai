import { describe, it, expect, vi, beforeEach } from "vitest";
import { getHeatmapData } from "./heatmapService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    matchParticipant: { findMany: vi.fn() },
    matchDeathEvent: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/ai/client", () => ({
  getAiClient: vi.fn().mockReturnValue({
    complete: vi.fn().mockResolvedValue({ content: "AI özet metni" }),
  }),
}));

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn().mockResolvedValue(null),
  setCached: vi.fn().mockResolvedValue(undefined),
  buildCacheKey: vi.fn().mockReturnValue("heatmap-cache-key"),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";

const makeDeathEvent = (x: number, y: number, gameTimeMs: number, championName = "Ahri") => ({
  positionX: x,
  positionY: y,
  gameTimeMs,
  championName,
});

const makeMatch = (id: string) => ({ match: { id } });

describe("getHeatmapData", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns hasData: false when no death events exist", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([makeMatch("m1")] as never);
    vi.mocked(prisma.matchDeathEvent.findMany).mockResolvedValue([]);

    const result = await getHeatmapData("acc-1");

    expect(result.hasData).toBe(false);
    expect(result.deaths).toHaveLength(0);
    expect(result.totalDeaths).toBe(0);
  });

  it("returns hasData: false when account has no matches", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([]);
    vi.mocked(prisma.matchDeathEvent.findMany).mockResolvedValue([]);

    const result = await getHeatmapData("acc-1");

    expect(result.hasData).toBe(false);
  });

  it("returns death coordinates mapped correctly", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([makeMatch("m1")] as never);
    vi.mocked(prisma.matchDeathEvent.findMany).mockResolvedValue([
      makeDeathEvent(3000, 5000, 300000),
      makeDeathEvent(11000, 8000, 900000),
    ] as never);

    const result = await getHeatmapData("acc-1");

    expect(result.hasData).toBe(true);
    expect(result.totalDeaths).toBe(2);
    expect(result.deaths[0]).toEqual({ x: 3000, y: 5000, gameTimeMs: 300000 });
    expect(result.deaths[1]).toEqual({ x: 11000, y: 8000, gameTimeMs: 900000 });
  });

  it("filters by time range 'early' (0–15 min)", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([makeMatch("m1")] as never);
    vi.mocked(prisma.matchDeathEvent.findMany).mockResolvedValue([
      makeDeathEvent(5000, 5000, 5 * 60 * 1000), // 5 min — early ✓
      makeDeathEvent(5000, 5000, 20 * 60 * 1000), // 20 min — mid ✗
      makeDeathEvent(5000, 5000, 40 * 60 * 1000), // 40 min — late ✗
    ] as never);

    const result = await getHeatmapData("acc-1", { timeRange: "early" });

    expect(result.totalDeaths).toBe(1);
    expect(result.deaths[0].gameTimeMs).toBe(5 * 60 * 1000);
  });

  it("filters by time range 'late' (30+ min)", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([makeMatch("m1")] as never);
    vi.mocked(prisma.matchDeathEvent.findMany).mockResolvedValue([
      makeDeathEvent(5000, 5000, 10 * 60 * 1000), // early ✗
      makeDeathEvent(5000, 5000, 35 * 60 * 1000), // late ✓
      makeDeathEvent(5000, 5000, 45 * 60 * 1000), // late ✓
    ] as never);

    const result = await getHeatmapData("acc-1", { timeRange: "late" });

    expect(result.totalDeaths).toBe(2);
  });

  it("free users get no AI summary (isPro = false)", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([makeMatch("m1")] as never);
    vi.mocked(prisma.matchDeathEvent.findMany).mockResolvedValue([
      makeDeathEvent(5000, 5000, 300000),
    ] as never);

    const result = await getHeatmapData("acc-1", { isPro: false });

    expect(result.summary).toBeNull();
  });

  it("pro users get AI summary", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([makeMatch("m1")] as never);
    vi.mocked(prisma.matchDeathEvent.findMany).mockResolvedValue([
      makeDeathEvent(5000, 5000, 300000),
    ] as never);

    const result = await getHeatmapData("acc-1", { isPro: true });

    expect(result.summary).toBe("AI özet metni");
  });

  it("caps matchCount at 10 for free users regardless of input", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([]);
    vi.mocked(prisma.matchDeathEvent.findMany).mockResolvedValue([]);

    await getHeatmapData("acc-1", { isPro: false, matchCount: 50 });

    expect(prisma.matchParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });

  it("caps matchCount at 50 for pro users", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([]);
    vi.mocked(prisma.matchDeathEvent.findMany).mockResolvedValue([]);

    await getHeatmapData("acc-1", { isPro: true, matchCount: 100 });

    expect(prisma.matchParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });
});
