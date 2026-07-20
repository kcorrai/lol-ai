import { describe, it, expect } from "vitest";
import { sortEntries, defaultDirectionFor, DEFAULT_SORT } from "./sortEntries";
import type { TierListEntry } from "@/domains/meta";

const entry = (over: Partial<TierListEntry> & { championKey: string }): TierListEntry => ({
  name: over.championKey,
  tier: 1,
  rank: 1,
  prevPatchRank: 1,
  winRate: 50,
  pickRate: 5,
  banRate: 5,
  games: 1000,
  lowConfidence: false,
  ...over,
});

const keys = (list: TierListEntry[]) => list.map((e) => e.championKey);

const LIST: TierListEntry[] = [
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

  it("opens the rate columns and movement highest-first", () => {
    expect(defaultDirectionFor("winRate")).toBe("desc");
    expect(defaultDirectionFor("movement")).toBe("desc");
  });
});
