import { describe, expect, it } from "vitest";
import type { DraftChampion } from "@/domains/draft/draftCatalog.types";
import { filterChampions, matchesQuery, normalise } from "./championSearch";

function champion(
  key: string,
  name: string,
  lanes: DraftChampion["lanes"] = ["MIDDLE"]
): DraftChampion {
  return { key, name, lanes, winRate: 50, pickRate: 5, banRate: 2 };
}

const ROSTER: DraftChampion[] = [
  champion("AurelionSol", "Aurelion Sol"),
  champion("MissFortune", "Miss Fortune", ["BOTTOM"]),
  champion("JarvanIV", "Jarvan IV", ["JUNGLE"]),
  champion("Khazix", "Kha'Zix", ["JUNGLE"]),
  champion("DrMundo", "Dr. Mundo", ["TOP", "JUNGLE"]),
  champion("MonkeyKing", "Wukong", ["TOP", "JUNGLE"]),
  champion("Ahri", "Ahri"),
  champion("Thresh", "Thresh", ["UTILITY"]),
];

describe("normalise", () => {
  it("drops punctuation, spaces and case", () => {
    expect(normalise("Kha'Zix")).toBe("khazix");
    expect(normalise("Dr. Mundo")).toBe("drmundo");
    expect(normalise("Nunu & Willump")).toBe("nunuwillump");
  });
});

describe("matchesQuery", () => {
  it("matches on any part of the name", () => {
    expect(matchesQuery(champion("Ahri", "Ahri"), "hri")).toBe(true);
    expect(matchesQuery(champion("Ahri", "Ahri"), "zed")).toBe(false);
  });

  it("ignores the punctuation people do not type", () => {
    expect(matchesQuery(champion("Khazix", "Kha'Zix"), "khaz")).toBe(true);
    expect(matchesQuery(champion("DrMundo", "Dr. Mundo"), "drmundo")).toBe(true);
  });

  it("matches the shorthand people actually use", () => {
    expect(matchesQuery(champion("AurelionSol", "Aurelion Sol"), "asol")).toBe(true);
    expect(matchesQuery(champion("MissFortune", "Miss Fortune"), "mf")).toBe(true);
    expect(matchesQuery(champion("JarvanIV", "Jarvan IV"), "j4")).toBe(true);
    expect(matchesQuery(champion("MonkeyKing", "Wukong"), "wukong")).toBe(true);
  });

  it("returns everything for an empty query", () => {
    expect(matchesQuery(champion("Ahri", "Ahri"), "   ")).toBe(true);
  });
});

describe("filterChampions", () => {
  it("narrows to a lane", () => {
    const jungle = filterChampions(ROSTER, { query: "", lane: "JUNGLE" });
    expect(jungle.map((c) => c.key)).toEqual(["JarvanIV", "Khazix", "DrMundo", "MonkeyKing"]);
  });

  it("keeps a champion in every lane it is played in", () => {
    expect(filterChampions(ROSTER, { query: "", lane: "TOP" }).map((c) => c.key)).toEqual([
      "DrMundo",
      "MonkeyKing",
    ]);
  });

  it("combines lane and query", () => {
    expect(filterChampions(ROSTER, { query: "j4", lane: "JUNGLE" }).map((c) => c.key)).toEqual([
      "JarvanIV",
    ]);
    expect(filterChampions(ROSTER, { query: "j4", lane: "UTILITY" })).toEqual([]);
  });

  it("returns the whole roster with no filter at all", () => {
    expect(filterChampions(ROSTER, { query: "", lane: null })).toHaveLength(ROSTER.length);
  });
});
