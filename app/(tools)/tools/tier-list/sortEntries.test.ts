import { describe, it, expect } from "vitest";
import { sortEntries, defaultDirectionFor, DEFAULT_SORT, type TierRow } from "./sortEntries";

const entry = (over: Partial<TierRow> & { championKey: string }): TierRow => ({
  name: over.championKey,
  tier: 1,
  rank: 1,
  prevPatchRank: 1,
  winRate: 50,
  pickRate: 5,
  banRate: 5,
  games: 1000,
  lowConfidence: false,
  proPickRate: null,
  ...over,
});

const keys = (list: TierRow[]) => list.map((e) => e.championKey);

const LIST: TierRow[] = [
  entry({ championKey: "Ahri", rank: 1, tier: 1, winRate: 51.4, pickRate: 9.2, banRate: 2.9, prevPatchRank: 2 }),
  entry({ championKey: "Sylas", rank: 2, tier: 1, winRate: 50.6, pickRate: 9.2, banRate: 19.4, prevPatchRank: 1 }),
  entry({ championKey: "Zed", rank: 3, tier: 2, winRate: 50.2, pickRate: 7.2, banRate: 19.0, prevPatchRank: 8 }),
];

describe("sortEntries", () => {
  it("leaves the meta order untouched at the default sort", () => {
    expect(keys(sortEntries(LIST, DEFAULT_SORT.column, DEFAULT_SORT.direction))).toEqual([
      "Ahri",
      "Sylas",
      "Zed",
    ]);
  });

  it("sorts by win rate, highest first when descending", () => {
    expect(keys(sortEntries(LIST, "winRate", "desc"))).toEqual(["Ahri", "Sylas", "Zed"]);
    expect(keys(sortEntries(LIST, "winRate", "asc"))).toEqual(["Zed", "Sylas", "Ahri"]);
  });

  it("sorts by ban rate", () => {
    expect(keys(sortEntries(LIST, "banRate", "desc"))).toEqual(["Sylas", "Zed", "Ahri"]);
  });

  it("breaks pick-rate ties on meta rank rather than reshuffling", () => {
    // Ahri and Sylas are both 9.2% pick rate.
    expect(keys(sortEntries(LIST, "pickRate", "desc")).slice(0, 2)).toEqual(["Ahri", "Sylas"]);
  });

  it("keeps meta order inside a tier when sorting by tier", () => {
    expect(keys(sortEntries(LIST, "tier", "asc"))).toEqual(["Ahri", "Sylas", "Zed"]);
  });

  it("sorts movement by how far a champion climbed", () => {
    // Zed +5, Ahri +1, Sylas -1.
    expect(keys(sortEntries(LIST, "movement", "desc"))).toEqual(["Zed", "Ahri", "Sylas"]);
    expect(keys(sortEntries(LIST, "movement", "asc"))).toEqual(["Sylas", "Ahri", "Zed"]);
  });

  it("sinks champions with no previous ranking in both directions", () => {
    // A new champion has no movement to compare — it must not read as the biggest faller.
    const withNew = [...LIST, entry({ championKey: "Aurora", rank: 4, prevPatchRank: 0 })];

    expect(keys(sortEntries(withNew, "movement", "desc")).at(-1)).toBe("Aurora");
    expect(keys(sortEntries(withNew, "movement", "asc")).at(-1)).toBe("Aurora");
  });

  it("ranks by pro pick rate, most-picked first when descending", () => {
    const withPro = [
      entry({ championKey: "Ahri", rank: 1, proPickRate: 12 }),
      entry({ championKey: "Sylas", rank: 2, proPickRate: 41 }),
      entry({ championKey: "Zed", rank: 3, proPickRate: 3 }),
    ];

    expect(keys(sortEntries(withPro, "pro", "desc"))).toEqual(["Sylas", "Ahri", "Zed"]);
    expect(keys(sortEntries(withPro, "pro", "asc"))).toEqual(["Zed", "Ahri", "Sylas"]);
  });

  it("sinks champions with no pro games in both directions", () => {
    // Most champions are never picked professionally. Absence from the sample is
    // not a pick rate of zero, and must not float to the top of an ascending sort.
    const withPro = [
      entry({ championKey: "Ahri", rank: 1, proPickRate: 12 }),
      entry({ championKey: "Sylas", rank: 2, proPickRate: 41 }),
      entry({ championKey: "Yuumi", rank: 3, proPickRate: null }),
    ];

    expect(keys(sortEntries(withPro, "pro", "desc")).at(-1)).toBe("Yuumi");
    expect(keys(sortEntries(withPro, "pro", "asc")).at(-1)).toBe("Yuumi");
  });

  it("falls back to meta order when nothing in the list has a pro pick rate", () => {
    expect(keys(sortEntries(LIST, "pro", "desc"))).toEqual(["Ahri", "Sylas", "Zed"]);
  });

  it("does not mutate the list it was given", () => {
    const original = keys(LIST);
    sortEntries(LIST, "winRate", "asc");
    expect(keys(LIST)).toEqual(original);
  });
});

describe("defaultDirectionFor", () => {
  it("opens rank and tier best-first ascending", () => {
    expect(defaultDirectionFor("rank")).toBe("asc");
    expect(defaultDirectionFor("tier")).toBe("asc");
  });

  it("opens the rate columns, movement and pro presence highest-first", () => {
    expect(defaultDirectionFor("winRate")).toBe("desc");
    expect(defaultDirectionFor("movement")).toBe("desc");
    expect(defaultDirectionFor("pro")).toBe("desc");
  });
});
