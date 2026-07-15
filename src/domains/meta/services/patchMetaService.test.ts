import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/domains/meta/services/metaStatsService", () => ({
  getMetaSnapshot: vi.fn(),
}));

import { getMetaReport } from "./patchMetaService";
import { getMetaSnapshot } from "@/domains/meta/services/metaStatsService";
import type { ChampionMetaStats, MetaSnapshot } from "@/domains/meta/types";

const mockSnapshot = getMetaSnapshot as unknown as ReturnType<typeof vi.fn>;

function champ(
  key: string,
  overallRank: number,
  prevPatchRank: number,
  extra: Partial<ChampionMetaStats> = {}
): ChampionMetaStats {
  return {
    championId: 1,
    championKey: key,
    name: key,
    overallWinRate: 51,
    overallPickRate: 6,
    overallBanRate: 4,
    overallGames: 42000,
    overallTier: 2,
    overallRank,
    prevPatchRank,
    positions: [],
    ...extra,
  };
}

const SNAPSHOT: MetaSnapshot = {
  patch: "16.14",
  fetchedAt: "x",
  champions: [
    champ("Riser", 5, 20), // +15 climb
    champ("Faller", 40, 12), // -28 drop
    champ("Steady", 10, 11), // -1, below MIN_RANK_DELTA
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSnapshot.mockResolvedValue(SNAPSHOT);
});

describe("getMetaReport", () => {
  it("splits movers into climbers and fallers and drops sub-threshold moves", async () => {
    const report = await getMetaReport();
    expect(report!.climbers.map((m) => m.championKey)).toEqual(["Riser"]);
    expect(report!.fallers.map((m) => m.championKey)).toEqual(["Faller"]);
    // Steady moved only 1 rank — excluded from both.
    const all = [...report!.climbers, ...report!.fallers].map((m) => m.championKey);
    expect(all).not.toContain("Steady");
  });

  it("carries tier, ban rate and sample size onto each mover", async () => {
    const report = await getMetaReport();
    const riser = report!.climbers[0];
    expect(riser.tier).toBe(2);
    expect(riser.banRate).toBe(4);
    expect(riser.games).toBe(42000);
    expect(riser.delta).toBe(15);
  });

  it("returns null when the snapshot is unavailable", async () => {
    mockSnapshot.mockResolvedValue(null);
    expect(await getMetaReport()).toBeNull();
  });
});
