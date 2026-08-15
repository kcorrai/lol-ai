import { describe, expect, it } from "vitest";
import { parseSearchQuery, MIN_QUERY_LENGTH } from "@/lib/riot/riotId";
import { rankSearchHits, type IndexedPlayer } from "@/domains/riot/services/playerSearch";

function player(overrides: Partial<IndexedPlayer> & { gameName: string }): IndexedPlayer {
  return {
    puuid: `puuid-${overrides.gameName}-${overrides.tagLine ?? "x"}`,
    tagLine: "EUW",
    region: "euw1",
    profileIconId: null,
    summonerLevel: null,
    seenCount: 1,
    lastSeenAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("parseSearchQuery", () => {
  it("splits a Riot ID into a lowercased name and tag", () => {
    expect(parseSearchQuery("Faker#KR1")).toEqual({ name: "faker", tag: "kr1" });
  });

  it("returns a null tag until the hash is typed", () => {
    expect(parseSearchQuery("Faker")).toEqual({ name: "faker", tag: null });
    expect(parseSearchQuery("Faker#")).toEqual({ name: "faker", tag: null });
  });

  it("splits on the first hash only, so a hash in the name stays in the tag", () => {
    expect(parseSearchQuery("na#me#tag")).toEqual({ name: "na", tag: "me#tag" });
  });

  it("strips the directional characters browsers inject into the box", () => {
    // U+2066 LTR Isolate — Chrome/Opera add this under a Turkish locale.
    expect(parseSearchQuery("⁦Faker⁩#KR1")).toEqual({ name: "faker", tag: "kr1" });
  });

  it("refuses a query too short to narrow anything", () => {
    expect(parseSearchQuery("f")).toBeNull();
    expect(parseSearchQuery("   ")).toBeNull();
    expect(parseSearchQuery("")).toBeNull();
    expect(parseSearchQuery("#KR1")).toBeNull();
    expect("fa".length).toBe(MIN_QUERY_LENGTH);
  });
});

describe("rankSearchHits", () => {
  const query = parseSearchQuery("faker")!;

  it("puts an exact name above a more-seen prefix match", () => {
    const hits = rankSearchHits(
      [player({ gameName: "FakerFan", seenCount: 500 }), player({ gameName: "Faker", seenCount: 2 })],
      query,
    );

    expect(hits.map((h) => h.gameName)).toEqual(["Faker", "FakerFan"]);
  });

  it("puts an exact name and tag above an exact name alone", () => {
    const tagged = parseSearchQuery("faker#kr1")!;
    const hits = rankSearchHits(
      [
        player({ gameName: "Faker", tagLine: "EUW", seenCount: 900 }),
        player({ gameName: "Faker", tagLine: "KR1", seenCount: 1 }),
      ],
      tagged,
    );

    expect(hits[0].tagLine).toBe("KR1");
  });

  it("orders equal-quality matches by how often we have seen them", () => {
    const hits = rankSearchHits(
      [
        player({ gameName: "FakerC", seenCount: 3 }),
        player({ gameName: "FakerA", seenCount: 40 }),
        player({ gameName: "FakerB", seenCount: 9 }),
      ],
      query,
    );

    expect(hits.map((h) => h.gameName)).toEqual(["FakerA", "FakerB", "FakerC"]);
  });

  it("breaks a full tie by name so the list does not reshuffle between keystrokes", () => {
    const same = { seenCount: 5, lastSeenAt: new Date("2026-02-02") };
    const rows = [
      player({ gameName: "FakerZ", ...same }),
      player({ gameName: "FakerA", ...same }),
    ];

    expect(rankSearchHits(rows, query).map((h) => h.gameName)).toEqual(
      rankSearchHits([...rows].reverse(), query).map((h) => h.gameName),
    );
  });

  it("trims to the visible count", () => {
    const rows = Array.from({ length: 30 }, (_, i) =>
      player({ gameName: `Faker${i}`, seenCount: i }),
    );

    expect(rankSearchHits(rows, query, 5)).toHaveLength(5);
  });

  it("returns nothing for no rows rather than throwing", () => {
    expect(rankSearchHits([], query)).toEqual([]);
  });
});
