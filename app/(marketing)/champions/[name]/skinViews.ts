import type { SkinMedia } from "@/lib/cdragon/skinMedia";

export interface SkinView {
  key: "ingame" | "splash" | "tile";
  label: string;
  url: string;
}

/**
 * The images the inspector can switch between for one skin.
 *
 * Splash art is an illustration; the load screen is a render of the model the game actually
 * puts on the Rift, which is what a reader asking "what does this skin look like in game"
 * came for. It leads for that reason, and the others are there to compare against.
 *
 * Only the views that have an image are returned, so a skin the Community Dragon catalogue
 * could not be read for collapses to the Data Dragon splash alone and the switcher hides.
 */
export function skinViews(skin: SkinMedia): SkinView[] {
  const views: SkinView[] = [];
  if (skin.loadScreenUrl) views.push({ key: "ingame", label: "In-game", url: skin.loadScreenUrl });
  views.push({ key: "splash", label: "Splash", url: skin.uncenteredSplashUrl ?? skin.splashUrl });
  if (skin.tileUrl) views.push({ key: "tile", label: "Tile", url: skin.tileUrl });
  return views;
}
