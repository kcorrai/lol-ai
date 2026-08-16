import { describe, it, expect } from "vitest";
import { sortChampions, parseProMetaSort } from "./proMetaSort";
import type { ProChampionStat } from "@/domains/esports/types";

function champion(over: Partial<ProChampionStat> & { championId: string }): ProChampionStat {
  return {
    picks: 10,
    wins: 5,
    decidedGames: 10,
    winRate: 50,
    pickRate: 20,
    roles: {},
    topRole: null,
    ...over,
  };
}

describe("parseProMetaSort", () => {
  it("falls back to pick order for anything it does not recognise", () => {
    expect(parseProMetaSort(undefined)).toBe("picks");
    expect(parseProMetaSort("nonsense")).toBe("picks");
    expect(parseProMetaSort("winRate")).toBe("winRate");
  });
});

describe("sortChampions", () => {
  it("leaves pick order alone — the aggregate already produced it", () => {
    const rows = [champion({ championId: "Azir" }), champion({ championId: "Jinx", picks: 4 })];
    expect(sortChampions(rows, "picks")).toBe(rows);
  });

  it("orders by win rate when asked", () => {
    const rows = [
      champion({ championId: "Azir", winRate: 40 }),
      champion({ championId: "Jinx", winRate: 70 }),
    ];
    expect(sortChampions(rows, "winRate").map((c) => c.championId)).toEqual(["Jinx", "Azir"]);
  });

  it("keeps a one-game 100% out of the top of a win-rate table", () => {
    const rows = [
      champion({ championId: "Azir", picks: 20, wins: 12, decidedGames: 20, winRate: 60 }),
      champion({ championId: "Fiddlesticks", picks: 1, wins: 1, decidedGames: 1, winRate: 100 }),
    ];

    expect(sortChampions(rows, "winRate").map((c) => c.championId)).toEqual(["Azir"]);
  });

  it("puts a champion with no decided games last rather than first", () => {
    const rows = [
      champion({ championId: "Azir", picks: 5, winRate: null, decidedGames: 0, wins: 0 }),
      champion({ championId: "Jinx", picks: 5, winRate: 30 }),
    ];

    expect(sortChampions(rows, "winRate").map((c) => c.championId)).toEqual(["Jinx", "Azir"]);
  });
});
