import { describe, expect, it } from "vitest";
import {
  detailTargets,
  sliceForDay,
  targetsInSlice,
} from "@/domains/meta/services/metaWarmRotation";
import type { ChampionMetaStats, MetaSnapshot, PositionStats } from "@/domains/meta/types";

function position(name: PositionStats["position"]): PositionStats {
  return {
    position: name,
    games: 100,
    winRate: 50,
    pickRate: 5,
    banRate: 1,
    tier: 2,
    rank: 3,
    prevPatchRank: 4,
    counters: [],
  };
}

function champion(championId: number, positions: PositionStats["position"][]): ChampionMetaStats {
  return {
    championId,
    championKey: `C${championId}`,
    name: `C${championId}`,
    overallWinRate: 50,
    overallPickRate: 5,
    overallBanRate: 1,
    overallGames: 1000,
    overallTier: 2,
    overallRank: 3,
    prevPatchRank: 4,
    positions: positions.map(position),
  };
}

function snapshot(champions: ChampionMetaStats[]): MetaSnapshot {
  return { patch: "16.15", fetchedAt: "2026-08-23T00:00:00.000Z", champions };
}

describe("detailTargets", () => {
  it("yields one target per champion and lane the feed reports", () => {
    const targets = detailTargets(
      snapshot([champion(1, ["TOP", "MIDDLE"]), champion(2, ["JUNGLE"])])
    );
    expect(targets).toEqual([
      { championId: 1, position: "MIDDLE" },
      { championId: 1, position: "TOP" },
      { championId: 2, position: "JUNGLE" },
    ]);
  });

  it("skips a champion the feed reports with no lanes rather than guessing one", () => {
    expect(detailTargets(snapshot([champion(1, [])]))).toEqual([]);
  });

  it("is ordered the same way whatever order the feed used, so slices are stable", () => {
    const a = detailTargets(snapshot([champion(2, ["TOP"]), champion(1, ["TOP"])]));
    const b = detailTargets(snapshot([champion(1, ["TOP"]), champion(2, ["TOP"])]));
    expect(a).toEqual(b);
  });
});

describe("sliceForDay", () => {
  it("advances once per UTC day and wraps at the slice count", () => {
    const day = 86_400_000;
    const first = sliceForDay(0, 7);
    expect(sliceForDay(day, 7)).toBe((first + 1) % 7);
    expect(sliceForDay(7 * day, 7)).toBe(first);
  });

  it("does not move within a day", () => {
    const noon = 12 * 60 * 60 * 1000;
    expect(sliceForDay(noon, 7)).toBe(sliceForDay(noon + 60_000, 7));
  });

  it("stays in range for a time before the epoch rather than going negative", () => {
    const slice = sliceForDay(-5 * 86_400_000, 7);
    expect(slice).toBeGreaterThanOrEqual(0);
    expect(slice).toBeLessThan(7);
  });
});

describe("targetsInSlice", () => {
  const targets = Array.from({ length: 10 }, (_, i) => ({
    championId: i,
    position: "TOP" as const,
  }));

  it("covers every target exactly once across a full rotation", () => {
    const seen = [0, 1, 2].flatMap((slice) => targetsInSlice(targets, slice, 3));
    expect(seen).toHaveLength(targets.length);
    expect(new Set(seen.map((t) => t.championId)).size).toBe(targets.length);
  });

  it("strides rather than chunking, so one run never takes a single stretch of the roster", () => {
    expect(targetsInSlice(targets, 0, 3).map((t) => t.championId)).toEqual([0, 3, 6, 9]);
    expect(targetsInSlice(targets, 1, 3).map((t) => t.championId)).toEqual([1, 4, 7]);
  });

  it("returns everything when there is only one slice", () => {
    expect(targetsInSlice(targets, 0, 1)).toHaveLength(targets.length);
  });

  it("is empty rather than throwing when the snapshot had nothing to walk", () => {
    expect(targetsInSlice([], 3, 7)).toEqual([]);
  });
});
