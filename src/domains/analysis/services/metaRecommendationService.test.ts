import { describe, it, expect } from "vitest";
import { buildRecommendations } from "./metaRecommendationService";
import type { ChampionPoolEntry } from "@/domains/champions";
import type { RoleTierList, CanonicalPosition, TierListEntry } from "@/domains/meta";

function poolEntry(championName: string, gamesPlayed: number, winRate: number): ChampionPoolEntry {
  return {
    championId: championName.length,
    championName,
    imageUrl: "",
    gamesPlayed,
    wins: Math.round((gamesPlayed * winRate) / 100),
    winRate,
    avgKda: 3,
    avgCsPerMinute: 6,
    isBest: false,
    masteryScore: 50,
    masterySubScores: { experience: 50, performance: 50, farm: 50 },
  };
}

function entry(name: string, tier: number, rank: number, prevPatchRank: number): TierListEntry {
  return {
    championKey: name,
    name,
    tier,
    rank,
    prevPatchRank,
    winRate: 51,
    pickRate: 5,
    banRate: 2,
    games: 4000,
    lowConfidence: false,
  };
}

function midList(entries: TierListEntry[]): Partial<Record<CanonicalPosition, RoleTierList>> {
  return {
    MIDDLE: { position: "MIDDLE", patch: "15.1", fetchedAt: "2026-01-01T00:00:00Z", entries },
  };
}

describe("buildRecommendations", () => {
  it("tells the user to keep spamming an S-tier main", () => {
    const recs = buildRecommendations(
      [poolEntry("Ahri", 60, 75)],
      midList([entry("Ahri", 1, 3, 3)])
    );
    expect(recs).toHaveLength(1);
    expect(recs[0].kind).toBe("keep");
    expect(recs[0].tier).toBe("S");
    expect(recs[0].toolHref).toBe("/tools/tier-list/mid");
  });

  it("does not say 'keep spamming' a meta-strong champ the user keeps losing on", () => {
    const recs = buildRecommendations(
      [poolEntry("Ahri", 9, 11)], // A/S-tier meta, but the user is at 11% WR
      midList([entry("Ahri", 1, 3, 3)])
    );
    expect(recs).toHaveLength(1);
    expect(recs[0].kind).toBe("improve");
    expect(recs[0].toolHref).toContain("counter-picker?champion=Ahri");
    expect(recs[0].message).not.toContain("keep spamming");
  });

  it("suggests a strong alternative for a weak main", () => {
    const recs = buildRecommendations(
      [poolEntry("Irelia", 20, 30)],
      midList([entry("Sylas", 1, 1, 1), entry("Irelia", 4, 40, 38)])
    );
    expect(recs).toHaveLength(1);
    expect(recs[0].kind).toBe("switch");
    expect(recs[0].alternative?.championName).toBe("Sylas");
    expect(recs[0].toolHref).toContain("counter-picker?champion=Irelia");
  });

  it("flags a mid-tier champion that slipped down the rankings", () => {
    const recs = buildRecommendations(
      [poolEntry("Zed", 15, 45)],
      midList([entry("Zed", 3, 30, 20)]) // tier 3, dropped 10 ranks
    );
    expect(recs).toHaveLength(1);
    expect(recs[0].kind).toBe("switch");
  });

  it("orders by most-played and respects the limit", () => {
    const recs = buildRecommendations(
      [poolEntry("Ahri", 10, 60), poolEntry("Sylas", 90, 55)],
      midList([entry("Sylas", 1, 1, 1), entry("Ahri", 2, 5, 5)]),
      1
    );
    expect(recs).toHaveLength(1);
    expect(recs[0].championName).toBe("Sylas"); // 90 games > 10 games
  });

  it("returns nothing for an empty pool", () => {
    expect(buildRecommendations([], midList([entry("Ahri", 1, 3, 3)]))).toEqual([]);
  });

  it("returns nothing when tier data is unavailable", () => {
    expect(buildRecommendations([poolEntry("Ahri", 60, 75)], {})).toEqual([]);
  });
});
