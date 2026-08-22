import { describe, it, expect } from "vitest";
import { mergeSkinMedia, type CdragonChampion } from "@/lib/cdragon/skinMedia";
import { CDRAGON_ROOT } from "@/lib/cdragon/assets";
import type { DdragonSkin } from "@/lib/ddragon/championsData";

const ASSET_ROOT = `${CDRAGON_ROOT}/assets`;

const DDRAGON_SKINS: DdragonSkin[] = [
  { id: "103000", num: 0, name: "default", chromas: false },
  { id: "103001", num: 1, name: "Dynasty Ahri", chromas: true },
  // Data Dragon lists chromas as skins; this is one, and the catalogue has no entry for it.
  { id: "103008", num: 8, name: "Popstar Ahri (Amethyst)", chromas: false },
];

// Trimmed from the live response for champion 103, keeping the fields the join reads.
const CDRAGON: CdragonChampion = {
  skins: [
    {
      id: 103000,
      name: "Ahri",
      isLegacy: false,
      rarity: "kNoRarity",
      description: null,
      uncenteredSplashPath:
        "/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Base/Images/ahri_splash_uncentered_0.jpg",
      tilePath:
        "/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Base/Images/ahri_splash_tile_0.jpg",
      loadScreenPath: "/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Base/AhriLoadscreen_0.jpg",
      chromas: null,
      skinFeaturePreviewData: null,
    },
    {
      id: 103001,
      name: "Dynasty Ahri",
      isLegacy: true,
      rarity: "kEpic",
      description:
        "Though Ahri's royal blood is obvious,<br>she prefers <font color='#fff'>mischief</font>.",
      uncenteredSplashPath:
        "/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Skin01/Images/ahri_splash_uncentered_1.jpg",
      tilePath:
        "/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Skin01/Images/ahri_splash_tile_1.jpg",
      loadScreenPath: "/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Skin01/AhriLoadscreen_1.jpg",
      chromas: [
        {
          id: 103052,
          name: "Dynasty Ahri (Ahri-versary)",
          colors: ["#2E38C4", "#C8003F"],
          tilePath: "/lol-game-data/assets/v1/champion-chroma-images/103/103052.png",
        },
      ],
      skinFeaturePreviewData: [
        {
          description: "Orb of Deception",
          iconPath: "ASSETS/Characters/Ahri/Skins/Skin01/SkinsFeaturesPreview/Ahri_Q.png",
          videoPath: "ASSETS/Characters/Ahri/Skins/Skin01/SkinsFeaturesPreview/Ahri01_Q.webm",
        },
      ],
    },
  ],
};

describe("mergeSkinMedia", () => {
  it("joins a Community Dragon skin to the Data Dragon skin sharing its low three digits", () => {
    const [, dynasty] = mergeSkinMedia(DDRAGON_SKINS, "Ahri", CDRAGON);
    expect(dynasty.loadScreenUrl).toBe(
      `${ASSET_ROOT}/characters/ahri/skins/skin01/ahriloadscreen_1.jpg`
    );
    expect(dynasty.tileUrl).toBe(
      `${ASSET_ROOT}/characters/ahri/skins/skin01/images/ahri_splash_tile_1.jpg`
    );
    expect(dynasty.rarity?.label).toBe("Epic");
    expect(dynasty.isLegacy).toBe(true);
  });

  it("always carries the Data Dragon splash, which no catalogue is needed for", () => {
    const [base, dynasty] = mergeSkinMedia(DDRAGON_SKINS, "Ahri", CDRAGON);
    expect(base.splashUrl).toContain("/champion/splash/Ahri_0.jpg");
    expect(dynasty.splashUrl).toContain("/champion/splash/Ahri_1.jpg");
  });

  it("gives the base skin a readable name instead of Data Dragon's 'default'", () => {
    expect(mergeSkinMedia(DDRAGON_SKINS, "Ahri", CDRAGON)[0].name).toBe("Default Ahri");
  });

  // Those padded entries splash-404 on Data Dragon, and each one already appears inside its
  // parent skin's chromas, so the readable catalogue decides what the gallery contains.
  it("drops the chroma entries the catalogue does not list as skins", () => {
    const merged = mergeSkinMedia(DDRAGON_SKINS, "Ahri", CDRAGON);
    expect(merged.map((skin) => skin.num)).toEqual([0, 1]);
  });

  // The degrade path: an unreachable catalogue must still render today's splash gallery.
  it("returns splash-only entries when the catalogue is unavailable", () => {
    const merged = mergeSkinMedia(DDRAGON_SKINS, "Ahri", undefined);
    // Nothing is dropped here: an unreachable catalogue must not silently shrink the page.
    expect(merged).toHaveLength(3);
    for (const skin of merged) {
      expect(skin.splashUrl).toContain("ddragon.leagueoflegends.com");
      expect(skin.loadScreenUrl).toBeNull();
      expect(skin.tileUrl).toBeNull();
      expect(skin.uncenteredSplashUrl).toBeNull();
      expect(skin.rarity).toBeNull();
      expect(skin.description).toBeNull();
      expect(skin.isLegacy).toBe(false);
      expect(skin.chromas).toEqual([]);
      expect(skin.clips).toEqual([]);
    }
  });

  it("strips markup out of the skin description", () => {
    const description = mergeSkinMedia(DDRAGON_SKINS, "Ahri", CDRAGON)[1].description;
    expect(description).toBe("Though Ahri's royal blood is obvious, she prefers mischief.");
  });

  it("leaves the description null when the catalogue has none", () => {
    expect(mergeSkinMedia(DDRAGON_SKINS, "Ahri", CDRAGON)[0].description).toBeNull();
  });

  it("maps chromas to swatch colours and a fetchable tile", () => {
    const [chroma] = mergeSkinMedia(DDRAGON_SKINS, "Ahri", CDRAGON)[1].chromas;
    expect(chroma).toEqual({
      id: 103052,
      name: "Dynasty Ahri (Ahri-versary)",
      colors: ["#2E38C4", "#C8003F"],
      tileUrl: `${CDRAGON_ROOT}/v1/champion-chroma-images/103/103052.png`,
    });
  });

  it("maps ability feature previews to a clip with both a video and a poster", () => {
    const [clip] = mergeSkinMedia(DDRAGON_SKINS, "Ahri", CDRAGON)[1].clips;
    expect(clip.description).toBe("Orb of Deception");
    expect(clip.videoUrl).toBe(
      `${ASSET_ROOT}/characters/ahri/skins/skin01/skinsfeaturespreview/ahri01_q.webm`
    );
    expect(clip.posterUrl).toBe(
      `${ASSET_ROOT}/characters/ahri/skins/skin01/skinsfeaturespreview/ahri_q.png`
    );
  });

  it("treats a null chroma or preview list as empty rather than throwing", () => {
    const base = mergeSkinMedia(DDRAGON_SKINS, "Ahri", CDRAGON)[0];
    expect(base.chromas).toEqual([]);
    expect(base.clips).toEqual([]);
  });

  it("returns nothing for a champion with no skins", () => {
    expect(mergeSkinMedia([], "Ahri", CDRAGON)).toEqual([]);
  });
});
