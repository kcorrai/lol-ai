import { describe, it, expect } from "vitest";
import { normalizeChampionKey, championIconUrl, DDRAGON_VERSION } from "@/lib/ddragon";
import { DDRAGON_CHAMPION_IDS } from "@/lib/ddragonChampionIds.fixture";

describe("normalizeChampionKey", () => {
  describe("apostrophe champions", () => {
    // Riot lowercases the letter after the apostrophe for these five. Building the
    // key by stripping the apostrophe alone yields KaiSa/BelVeth/…, which 403s.
    it.each([
      ["Bel'Veth", "Belveth"],
      ["Cho'Gath", "Chogath"],
      ["Kai'Sa", "Kaisa"],
      ["Kha'Zix", "Khazix"],
      ["Vel'Koz", "Velkoz"],
    ])("lowercases the letter after the apostrophe: %s", (name, expected) => {
      expect(normalizeChampionKey(name)).toBe(expected);
    });

    // ...and keeps it for these three, which is why no regex can cover both groups.
    it.each([
      ["Kog'Maw", "KogMaw"],
      ["Rek'Sai", "RekSai"],
      ["K'Sante", "KSante"],
    ])("keeps the letter after the apostrophe: %s", (name, expected) => {
      expect(normalizeChampionKey(name)).toBe(expected);
    });
  });

  it.each([
    ["Wukong", "MonkeyKing"],
    ["Nunu & Willump", "Nunu"],
    ["Renata Glasc", "Renata"],
    ["LeBlanc", "Leblanc"],
    ["Fiddlesticks", "Fiddlesticks"],
  ])("maps the renamed champion %s", (name, expected) => {
    expect(normalizeChampionKey(name)).toBe(expected);
  });

  it.each([
    ["Dr. Mundo", "DrMundo"],
    ["Lee Sin", "LeeSin"],
    ["Master Yi", "MasterYi"],
    ["Miss Fortune", "MissFortune"],
    ["Aurelion Sol", "AurelionSol"],
    ["Jarvan IV", "JarvanIV"],
    ["Tahm Kench", "TahmKench"],
  ])("strips spaces and dots from %s", (name, expected) => {
    expect(normalizeChampionKey(name)).toBe(expected);
  });

  it.each(["Ahri", "Zed", "Jinx", "Yasuo"])("leaves the plain name %s untouched", (name) => {
    expect(normalizeChampionKey(name)).toBe(name);
  });

  it("passes an already-normalized key through unchanged", () => {
    // Riot's match API returns ids, not display names, so both forms reach this fn.
    expect(normalizeChampionKey("Kaisa")).toBe("Kaisa");
    expect(normalizeChampionKey("MonkeyKing")).toBe("MonkeyKing");
  });

  // Guard: a new champion whose id is not derivable from its display name fails
  // here instead of shipping a blank icon to every surface that shows champion art.
  it("resolves every champion in the Data Dragon snapshot", () => {
    const unresolved = DDRAGON_CHAMPION_IDS.filter(
      ([name, id]) => normalizeChampionKey(name) !== id
    ).map(([name, id]) => `${name} -> ${normalizeChampionKey(name)} (expected ${id})`);

    expect(unresolved).toEqual([]);
    expect(DDRAGON_CHAMPION_IDS.length).toBeGreaterThanOrEqual(173);
  });
});

describe("championIconUrl", () => {
  it("builds a Data Dragon icon URL for a previously broken champion", () => {
    expect(championIconUrl("Kai'Sa")).toBe(
      `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/Kaisa.png`
    );
  });
});
