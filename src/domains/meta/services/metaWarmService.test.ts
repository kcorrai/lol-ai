import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChampionMetaStats, MetaSnapshot } from "@/domains/meta/types";

const getMetaSnapshot = vi.hoisted(() => vi.fn());
const refreshSnapshotLastGood = vi.hoisted(() => vi.fn());
const refreshDetailLastGood = vi.hoisted(() => vi.fn());

vi.mock("@/domains/meta/services/metaStatsService", () => ({
  getMetaSnapshot,
  refreshSnapshotLastGood,
}));
vi.mock("@/domains/meta/services/championDetailService", () => ({ refreshDetailLastGood }));

import { warmMetaCache } from "@/domains/meta/services/metaWarmService";

function champion(championId: number, positions: string[]): ChampionMetaStats {
  return {
    championId,
    championKey: `C${championId}`,
    name: `C${championId}`,
    overallWinRate: 50,
    overallPickRate: 5,
    overallBanRate: 1,
    overallGames: 1000,
    overallTier: 2,
    overallRank: 1,
    prevPatchRank: 1,
    positions: positions.map((p) => ({
      position: p as ChampionMetaStats["positions"][number]["position"],
      games: 100,
      winRate: 50,
      pickRate: 5,
      banRate: 1,
      tier: 2,
      rank: 1,
      prevPatchRank: 1,
      counters: [],
    })),
  };
}

function snapshotOf(count: number): MetaSnapshot {
  return {
    patch: "16.15",
    fetchedAt: "2026-08-23T00:00:00.000Z",
    champions: Array.from({ length: count }, (_, i) => champion(i + 1, ["TOP"])),
  };
}

// One UTC day whose slice is 0, so the strided share is deterministic in these tests.
const DAY_IN_SLICE_ZERO = 0;

beforeEach(() => {
  getMetaSnapshot.mockReset();
  refreshSnapshotLastGood.mockReset();
  refreshDetailLastGood.mockReset();
  refreshSnapshotLastGood.mockResolvedValue(true);
  refreshDetailLastGood.mockResolvedValue(true);
});

describe("warmMetaCache", () => {
  it("refreshes every snapshot bracket, and walks this day's share of the details", async () => {
    getMetaSnapshot.mockResolvedValue(snapshotOf(14));

    const result = await warmMetaCache({ nowMs: DAY_IN_SLICE_ZERO, gapMs: 0 });

    // ranked default + seven brackets + aram
    expect(result.snapshots).toBe(9);
    // 14 targets across 7 slices, strided
    expect(result.details).toBe(2);
    expect(result.failures).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.slices).toBe(7);
  });

  it("counts a variant it could not write as a failure rather than passing over it", async () => {
    refreshSnapshotLastGood.mockResolvedValue(false);
    getMetaSnapshot.mockResolvedValue(null);

    const result = await warmMetaCache({ nowMs: DAY_IN_SLICE_ZERO, gapMs: 0 });

    expect(result.snapshots).toBe(0);
    expect(result.failures).toBe(9);
  });

  it("writes durably rather than reading through the fresh cache", async () => {
    getMetaSnapshot.mockResolvedValue(snapshotOf(7));

    await warmMetaCache({ nowMs: DAY_IN_SLICE_ZERO, gapMs: 0 });

    // The fresh read is only ever used to learn the shape of the roster; every warm goes
    // through the refreshers, or the durable row this exists to create is never written.
    expect(refreshSnapshotLastGood).toHaveBeenCalledTimes(9);
    expect(getMetaSnapshot).toHaveBeenCalledTimes(1);
  });

  it("does not walk details when the feed cannot say which details exist", async () => {
    getMetaSnapshot.mockResolvedValue(null);

    const result = await warmMetaCache({ nowMs: DAY_IN_SLICE_ZERO, gapMs: 0 });

    expect(refreshDetailLastGood).not.toHaveBeenCalled();
    expect(result.details).toBe(0);
  });

  it("survives a refresh that rejects rather than resolving false", async () => {
    refreshSnapshotLastGood.mockRejectedValue(new Error("op.gg exploded"));
    getMetaSnapshot.mockRejectedValue(new Error("op.gg exploded"));

    const result = await warmMetaCache({ nowMs: DAY_IN_SLICE_ZERO, gapMs: 0 });

    expect(result.failures).toBe(9);
    expect(result.details).toBe(0);
  });

  it("reports what the deadline cut off instead of dropping it quietly", async () => {
    getMetaSnapshot.mockResolvedValue(snapshotOf(70));

    // Already past the deadline by the time the details loop starts.
    const result = await warmMetaCache({ nowMs: DAY_IN_SLICE_ZERO, gapMs: 0, deadlineMs: 0 });

    expect(result.details).toBe(0);
    expect(result.skipped).toBe(10);
  });

  it("counts a detail that comes back empty as a failure", async () => {
    getMetaSnapshot.mockResolvedValue(snapshotOf(7));
    refreshDetailLastGood.mockResolvedValue(false);

    const result = await warmMetaCache({ nowMs: DAY_IN_SLICE_ZERO, gapMs: 0 });

    expect(result.details).toBe(0);
    expect(result.failures).toBe(1);
  });

  it("moves to a different share of the roster the next day", async () => {
    getMetaSnapshot.mockResolvedValue(snapshotOf(14));

    await warmMetaCache({ nowMs: DAY_IN_SLICE_ZERO, gapMs: 0 });
    const firstDay = refreshDetailLastGood.mock.calls.map((c) => c[0]);

    refreshDetailLastGood.mockClear();
    await warmMetaCache({ nowMs: DAY_IN_SLICE_ZERO + 86_400_000, gapMs: 0 });
    const secondDay = refreshDetailLastGood.mock.calls.map((c) => c[0]);

    expect(secondDay).not.toEqual(firstDay);
    expect(firstDay.some((id) => secondDay.includes(id))).toBe(false);
  });
});
