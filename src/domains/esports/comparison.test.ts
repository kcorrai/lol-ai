import { describe, it, expect } from "vitest";
import {
  buildComparison,
  formatMetric,
  isLowSample,
  MIN_PLAYER_GAMES,
  type PlayerChampionAverages,
} from "./comparison";
import type { ProChampionAverages } from "./types";

function pro(over: Partial<ProChampionAverages> = {}): ProChampionAverages {
  return {
    kills: 4,
    deaths: 2,
    assists: 6,
    kda: 5,
    creepScore: 300,
    gold: 15000,
    wardsPlaced: 12,
    killParticipation: 0.65,
    damageShare: 0.25,
    winRate: 55,
    ...over,
  };
}

function you(over: Partial<PlayerChampionAverages> = {}): PlayerChampionAverages {
  return {
    games: 10,
    kda: 2.5,
    winRate: 50,
    creepScore: 210,
    gold: 12000,
    wardsPlaced: 8,
    ...over,
  };
}

function row(rows: ReturnType<typeof buildComparison>, key: string) {
  return rows.find((entry) => entry.key === key);
}

describe("buildComparison", () => {
  it("signs the gap from the player's side and scales it against the pro figure", () => {
    const rows = buildComparison(pro(), you());

    expect(row(rows, "kda")).toMatchObject({ pro: 5, you: 2.5, gap: -2.5, gapPercent: -50 });
  });

  it("reports a gap the other way when the player is ahead", () => {
    const rows = buildComparison(pro({ winRate: 40 }), you({ winRate: 60 }));

    expect(row(rows, "winRate")?.gap).toBe(20);
    expect(row(rows, "winRate")?.gapPercent).toBe(50);
  });

  it("drops a row the player's side has no number for", () => {
    // The signed-out path publishes results and KDA and nothing else.
    const rows = buildComparison(
      pro(),
      you({ creepScore: null, gold: null, wardsPlaced: null })
    );

    expect(rows.map((entry) => entry.key)).toEqual(["kda", "winRate"]);
  });

  it("drops a row the pro side has no number for", () => {
    const rows = buildComparison(pro({ wardsPlaced: null }), you());

    expect(row(rows, "wardsPlaced")).toBeUndefined();
    expect(row(rows, "creepScore")).toBeDefined();
  });

  it("withholds every reading when the player has too few games", () => {
    const rows = buildComparison(pro(), you({ games: MIN_PLAYER_GAMES - 1 }));

    // The numbers are still shown — refusing to is worse — but nothing is read
    // into two games.
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((entry) => entry.reading === null)).toBe(true);
  });

  it("reads a gap only once it is big enough to mean something", () => {
    const tiny = buildComparison(pro({ kda: 5 }), you({ kda: 4.9 }));
    const real = buildComparison(pro({ kda: 5 }), you({ kda: 2.5 }));

    expect(row(tiny, "kda")?.reading).toBeNull();
    expect(row(real, "kda")?.reading).toContain("Pros die less");
  });

  it("reads being ahead as being ahead", () => {
    const rows = buildComparison(pro({ creepScore: 200 }), you({ creepScore: 300 }));

    expect(row(rows, "creepScore")?.reading).toContain("pro volume");
  });

  it("does not divide by a zero pro figure", () => {
    const rows = buildComparison(pro({ winRate: 0 }), you({ winRate: 50 }));

    expect(row(rows, "winRate")?.gapPercent).toBeNull();
    expect(row(rows, "winRate")?.reading).toBeNull();
  });
});

describe("isLowSample", () => {
  it("draws the line at the minimum, inclusive", () => {
    expect(isLowSample(you({ games: MIN_PLAYER_GAMES - 1 }))).toBe(true);
    expect(isLowSample(you({ games: MIN_PLAYER_GAMES }))).toBe(false);
  });
});

describe("formatMetric", () => {
  it("formats each metric the way it is read", () => {
    expect(formatMetric(2.456, "ratio")).toBe("2.46");
    expect(formatMetric(54.6, "percent")).toBe("55%");
    expect(formatMetric(210.4, "integer")).toBe("210");
  });
});
