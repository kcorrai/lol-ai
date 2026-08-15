import { describe, expect, it } from "vitest";
import { buildSearchRows } from "@/components/search/buildSearchRows";
import type { SearchHit } from "@/components/search/searchTypes";

const hit = (gameName: string, tagLine = "EUW"): SearchHit => ({
  puuid: `puuid-${gameName}`,
  gameName,
  tagLine,
  region: "euw1",
});

const base = { region: "euw1", hits: [], recent: [], favorites: [] };

describe("buildSearchRows", () => {
  it("shows favourites then recents when nothing has been typed", () => {
    const rows = buildSearchRows({
      ...base,
      query: "",
      favorites: [hit("Starred")],
      recent: [hit("Visited")],
    });

    expect(rows.map((r) => [r.section, r.hit.gameName])).toEqual([
      ["favorites", "Starred"],
      ["recent", "Visited"],
    ]);
  });

  it("does not repeat a favourite under recents", () => {
    const both = hit("Both");
    const rows = buildSearchRows({ ...base, query: "", favorites: [both], recent: [both] });

    expect(rows).toHaveLength(1);
    expect(rows[0]!.section).toBe("favorites");
  });

  it("shows index hits once a query is typed, and drops the shortcut lists", () => {
    const rows = buildSearchRows({
      ...base,
      query: "fa",
      hits: [hit("Faker")],
      favorites: [hit("Starred")],
      recent: [hit("Visited")],
    });

    expect(rows.map((r) => r.section)).toEqual(["players"]);
  });

  it("offers a direct Riot lookup for a complete Riot ID the index does not know", () => {
    const rows = buildSearchRows({ ...base, query: "Ghost#NA1", hits: [hit("Ghostly")] });

    expect(rows[rows.length - 1]).toEqual({
      section: "direct",
      hit: { gameName: "Ghost", tagLine: "NA1", region: "euw1" },
    });
  });

  it("does not offer a direct lookup for a player the index already listed", () => {
    const rows = buildSearchRows({ ...base, query: "faker#euw", hits: [hit("Faker", "EUW")] });

    expect(rows.every((r) => r.section !== "direct")).toBe(true);
  });

  it("does not offer a direct lookup before a tag is typed — there is nothing to resolve", () => {
    const rows = buildSearchRows({ ...base, query: "Faker", hits: [] });

    expect(rows).toEqual([]);
  });

  it("keeps the typed casing on the direct row, since that is what Riot displays", () => {
    const rows = buildSearchRows({ ...base, query: "  KaanProAk0#TR1  ", hits: [] });

    expect(rows[0]!.hit).toEqual({ gameName: "KaanProAk0", tagLine: "TR1", region: "euw1" });
  });

  it("uses the selected region for the direct row", () => {
    const rows = buildSearchRows({ ...base, region: "kr", query: "Hide#KR1", hits: [] });

    expect(rows[0]!.hit.region).toBe("kr");
  });
});
