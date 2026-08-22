import { describe, it, expect } from "vitest";
import { CDRAGON_ROOT, cdragonAssetUrl, skinRarity } from "@/lib/cdragon/assets";

const ASSET_ROOT = `${CDRAGON_ROOT}/assets`;

describe("cdragonAssetUrl", () => {
  // The expected value is a URL confirmed to return 200 image/jpeg. The catalogue's own
  // mixed-case spelling 404s, which is the whole reason this function exists.
  it("strips the game-data prefix and lowercases the rest", () => {
    expect(
      cdragonAssetUrl("/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Skin01/AhriLoadscreen_1.jpg")
    ).toBe(`${ASSET_ROOT}/characters/ahri/skins/skin01/ahriloadscreen_1.jpg`);
  });

  // skinFeaturePreviewData writes the same locations without the prefix.
  it("resolves a prefix-less ASSETS path against the same root", () => {
    expect(
      cdragonAssetUrl("ASSETS/Characters/MasterYi/Skins/Skin116/SkinsFeaturesPreview/MasterYi116_Q.webm")
    ).toBe(`${ASSET_ROOT}/characters/masteryi/skins/skin116/skinsfeaturespreview/masteryi116_q.webm`);
  });

  // Chroma images sit under /v1/, not under /assets/ — the prefix strip must keep whichever
  // tree the catalogue named rather than forcing every asset into one of them.
  it("keeps a non-ASSETS tree such as the chroma images", () => {
    expect(cdragonAssetUrl("/lol-game-data/assets/v1/champion-chroma-images/103/103052.png")).toBe(
      `${CDRAGON_ROOT}/v1/champion-chroma-images/103/103052.png`
    );
  });

  it("returns an empty string for an empty path rather than a root-only URL", () => {
    expect(cdragonAssetUrl("")).toBe("");
  });
});

const LABELLED = ["kRare", "kEpic", "kLegendary", "kMythic", "kUltimate", "kExalted", "kTranscendent"];

describe("skinRarity", () => {
  it.each([
    ["kRare", "Rare"],
    ["kEpic", "Epic"],
    ["kLegendary", "Legendary"],
    ["kMythic", "Mythic"],
    ["kUltimate", "Ultimate"],
    ["kExalted", "Exalted"],
    ["kTranscendent", "Transcendent"],
  ])("labels %s as %s", (raw, label) => {
    expect(skinRarity(raw)?.label).toBe(label);
  });

  it("gives every labelled rarity a tone class", () => {
    for (const raw of LABELLED) {
      expect(skinRarity(raw)?.toneClass).toBeTruthy();
    }
  });

  // 832 of 2146 skins are kNoRarity — badging them all would say nothing.
  it("returns null for kNoRarity", () => {
    expect(skinRarity("kNoRarity")).toBeNull();
  });

  it("returns null for a rarity the catalogue adds later", () => {
    expect(skinRarity("kSomethingRiotShipsNextYear")).toBeNull();
  });
});
