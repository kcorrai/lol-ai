import { describe, it, expect } from "vitest";
import { skinViews } from "./skinViews";
import type { SkinMedia } from "@/lib/cdragon/skinMedia";

function skin(overrides: Partial<SkinMedia> = {}): SkinMedia {
  return {
    num: 1,
    name: "Dynasty Ahri",
    splashUrl: "https://ddragon.example/splash/Ahri_1.jpg",
    loadScreenUrl: "https://cdragon.example/loadscreen_1.jpg",
    tileUrl: "https://cdragon.example/tile_1.jpg",
    uncenteredSplashUrl: "https://cdragon.example/uncentered_1.jpg",
    rarity: null,
    isLegacy: false,
    description: null,
    chromas: [],
    clips: [],
    ...overrides,
  };
}

describe("skinViews", () => {
  it("leads with the in-game render, which is what the section is for", () => {
    const views = skinViews(skin());
    expect(views.map((v) => v.key)).toEqual(["ingame", "splash", "tile"]);
    expect(views[0].url).toBe("https://cdragon.example/loadscreen_1.jpg");
  });

  it("prefers the wider uncentered splash over Data Dragon's", () => {
    expect(skinViews(skin()).find((v) => v.key === "splash")?.url).toBe(
      "https://cdragon.example/uncentered_1.jpg"
    );
  });

  it("falls back to the Data Dragon splash when there is no uncentered one", () => {
    expect(
      skinViews(skin({ uncenteredSplashUrl: null })).find((v) => v.key === "splash")?.url
    ).toBe("https://ddragon.example/splash/Ahri_1.jpg");
  });

  // The degrade path: no catalogue means no renders, and the switcher has nothing to switch.
  it("collapses to splash alone when the catalogue was unavailable", () => {
    const views = skinViews(
      skin({ loadScreenUrl: null, tileUrl: null, uncenteredSplashUrl: null })
    );
    expect(views).toHaveLength(1);
    expect(views[0]).toEqual({
      key: "splash",
      label: "Splash",
      url: "https://ddragon.example/splash/Ahri_1.jpg",
    });
  });

  it("omits only the views that have no image", () => {
    expect(skinViews(skin({ tileUrl: null })).map((v) => v.key)).toEqual(["ingame", "splash"]);
    expect(skinViews(skin({ loadScreenUrl: null })).map((v) => v.key)).toEqual(["splash", "tile"]);
  });

  it("labels every view for the switcher", () => {
    for (const view of skinViews(skin())) {
      expect(view.label).toBeTruthy();
    }
  });
});
