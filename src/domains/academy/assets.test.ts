import { describe, expect, it } from "vitest";
import {
  ACADEMY_ITEMS,
  ACADEMY_KEYSTONES,
  ACADEMY_SUMMONERS,
  resolveAsset,
  type AcademyItemId,
  type AcademyKeystoneId,
  type AcademySummonerId,
  type LessonAssetRef,
} from "./assets";

const CATALOGUES = [
  ["items", ACADEMY_ITEMS],
  ["summoner spells", ACADEMY_SUMMONERS],
  ["keystones", ACADEMY_KEYSTONES],
] as const;

/** One reference per catalogue entry, which is the whole surface a lesson can name. */
function everyRef(): LessonAssetRef[] {
  return [
    ...Object.keys(ACADEMY_ITEMS).map(
      (item): LessonAssetRef => ({ of: "item", item: item as AcademyItemId })
    ),
    ...Object.keys(ACADEMY_SUMMONERS).map(
      (spell): LessonAssetRef => ({ of: "summoner", spell: spell as AcademySummonerId })
    ),
    ...Object.keys(ACADEMY_KEYSTONES).map(
      (keystone): LessonAssetRef => ({ of: "keystone", keystone: keystone as AcademyKeystoneId })
    ),
  ];
}

describe("the asset catalogue", () => {
  it.each(CATALOGUES)("gives every %s entry a kebab-case slug and a name", (_label, catalogue) => {
    for (const [slug, asset] of Object.entries(catalogue)) {
      expect(slug, `${slug} is not kebab-case`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(asset.name.length, `${slug} has no name`).toBeGreaterThan(2);
    }
  });

  it.each(CATALOGUES)("never lists the same %s twice", (_label, catalogue) => {
    const ids = Object.values(catalogue).map((asset) => asset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * The one that earns its keep. `summonerSpellUrl` and `keystoneIconUrl` answer an id they do
   * not know with an empty string rather than an error, so a wrong id here would ship as an
   * invisible image instead of a failure.
   */
  it("resolves every entry to a real Data Dragon URL", () => {
    for (const ref of everyRef()) {
      const { src, name } = resolveAsset(ref);
      expect(src, `${JSON.stringify(ref)} resolved to nothing`).toMatch(
        /^https:\/\/ddragon\.leagueoflegends\.com\//
      );
      expect(name.length).toBeGreaterThan(2);
    }
  });

  it("resolves a champion by display name, punctuation and all", () => {
    const { src, name } = resolveAsset({ of: "champion", name: "Kai'Sa" });
    expect(src).toContain("/img/champion/Kaisa.png");
    // The label keeps the apostrophe even though the file name cannot.
    expect(name).toBe("Kai'Sa");
  });
});
