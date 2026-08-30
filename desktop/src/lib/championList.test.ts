import { describe, expect, it } from "vitest";
import type { DesktopChampionEntry } from "./champions";
import { groupByTier, sortChampions, winRateFill, winRateTone } from "./championList";

function entry(over: Partial<DesktopChampionEntry> = {}): DesktopChampionEntry {
  return {
    championKey: "Ahri",
    name: "Ahri",
    tier: 1,
    rank: 1,
    winRate: 52.4,
    pickRate: 12.8,
    banRate: 6.1,
    games: 184_203,
    lowConfidence: false,
    ...over,
  };
}

describe("sortChampions", () => {
  /**
   * The website ranked the lane already, by tier and then by rank, with thin samples sunk.
   * Re-deriving that here would be a second opinion from two of the fields it used.
   */
  it("leaves the list alone under the tier sort", () => {
    const list = [entry({ name: "Ahri", winRate: 50 }), entry({ name: "Zed", winRate: 58 })];

    expect(sortChampions(list, "Tier")).toBe(list);
  });

  it("puts the highest win rate first", () => {
    const list = [
      entry({ name: "Ahri", winRate: 50.1 }),
      entry({ name: "Zed", winRate: 58.2 }),
      entry({ name: "Lux", winRate: 47.4 }),
    ];

    expect(sortChampions(list, "Win rate").map((e) => e.name)).toEqual(["Zed", "Ahri", "Lux"]);
  });

  it("puts the most picked first", () => {
    const list = [entry({ name: "Ahri", pickRate: 3.2 }), entry({ name: "Zed", pickRate: 11.9 })];

    expect(sortChampions(list, "Pick rate").map((e) => e.name)).toEqual(["Zed", "Ahri"]);
  });

  /** The list belongs to the cache in `useChampions`; sorting it in place would reorder it. */
  it("does not reorder the array it was given", () => {
    const list = [entry({ name: "Ahri", winRate: 50 }), entry({ name: "Zed", winRate: 58 })];

    sortChampions(list, "Win rate");

    expect(list.map((e) => e.name)).toEqual(["Ahri", "Zed"]);
  });
});

describe("groupByTier", () => {
  it("cuts the list into runs and names each one", () => {
    const groups = groupByTier([
      entry({ name: "Ahri", tier: 1 }),
      entry({ name: "Syndra", tier: 1 }),
      entry({ name: "Lux", tier: 3 }),
    ]);

    expect(groups.map((g) => g.letter)).toEqual(["S", "B"]);
    expect(groups[0].entries.map((e) => e.name)).toEqual(["Ahri", "Syndra"]);
    expect(groups[0].note).toBe("Pick these blind");
  });

  /**
   * Under a win-rate sort an A-tier champion really can out-win an S-tier one. That is a
   * fact about the patch, and merging the two runs would hide it behind one header.
   */
  it("draws a tier twice when the sort has split it in two", () => {
    const groups = groupByTier([
      entry({ name: "Ahri", tier: 1 }),
      entry({ name: "Yone", tier: 2 }),
      entry({ name: "Syndra", tier: 1 }),
    ]);

    expect(groups.map((g) => g.letter)).toEqual(["S", "A", "S"]);
  });

  it("names a tier the snapshot did not give", () => {
    const groups = groupByTier([entry({ tier: 0 })]);

    expect(groups[0].letter).toBe("?");
    expect(groups[0].note).toBe("The snapshot gave no tier");
  });

  it("emits nothing for an empty lane", () => {
    expect(groupByTier([])).toEqual([]);
  });
});

describe("winRateFill", () => {
  /**
   * Scaled 46–54, not 0–100. Every champion in the game sits within a few points of even,
   * so a bar from zero would be four-fifths full for all of them and say nothing.
   */
  it("puts an even win rate near the middle of the track", () => {
    expect(winRateFill(50)).toBe(50);
  });

  it("empties the track at the bottom of the range and fills it at the top", () => {
    expect(winRateFill(46)).toBe(0);
    expect(winRateFill(54)).toBe(100);
  });

  it("clamps a rate outside the range rather than overflowing the track", () => {
    expect(winRateFill(30)).toBe(0);
    expect(winRateFill(90)).toBe(100);
  });
});

describe("winRateTone", () => {
  it("reads a rate the way the website's own tier list does", () => {
    expect(winRateTone(52)).toBe("good");
    expect(winRateTone(51.9)).toBe("even");
    expect(winRateTone(50)).toBe("even");
    expect(winRateTone(49.9)).toBe("bad");
  });
});
