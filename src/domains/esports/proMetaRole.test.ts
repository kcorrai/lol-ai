import { describe, it, expect } from "vitest";
import { filterByRole, parseProMetaRole } from "./proMetaRole";
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

describe("parseProMetaRole", () => {
  it("returns null for anything that is not one of the five lanes", () => {
    expect(parseProMetaRole(undefined)).toBeNull();
    expect(parseProMetaRole("")).toBeNull();
    expect(parseProMetaRole("adc")).toBeNull();
    expect(parseProMetaRole("Mid")).toBeNull();
  });

  it("passes a lane through", () => {
    expect(parseProMetaRole("bottom")).toBe("bottom");
    expect(parseProMetaRole("support")).toBe("support");
  });
});

describe("filterByRole", () => {
  it("hands the table back untouched when no lane is named", () => {
    const rows = [champion({ championId: "Azir" })];
    expect(filterByRole(rows, null)).toBe(rows);
  });

  it("keeps a champion played in the lane", () => {
    const rows = [
      champion({ championId: "Azir", roles: { mid: 12 }, topRole: "mid" }),
      champion({ championId: "Jinx", roles: { bottom: 9 }, topRole: "bottom" }),
    ];

    expect(filterByRole(rows, "mid").map((c) => c.championId)).toEqual(["Azir"]);
  });

  it("keeps a flex pick under its secondary lane, not only its main one", () => {
    const rows = [champion({ championId: "Sylas", roles: { mid: 10, top: 9 }, topRole: "mid" })];

    expect(filterByRole(rows, "top").map((c) => c.championId)).toEqual(["Sylas"]);
  });

  it("drops a champion with no recorded games in the lane", () => {
    const rows = [champion({ championId: "Sylas", roles: { mid: 10 }, topRole: "mid" })];
    expect(filterByRole(rows, "jungle")).toEqual([]);
  });
});
