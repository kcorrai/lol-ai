export const CDRAGON_ROOT =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default";

const GAME_DATA_PREFIX = "/lol-game-data/assets/";

export interface SkinRarity {
  label: string;
  /** Tailwind text + border classes, drawn from the existing palette (ADR-015). */
  toneClass: string;
}

/**
 * Turns a Community Dragon asset reference into a fetchable URL.
 *
 * The champion catalogue writes absolute game-data paths (`/lol-game-data/assets/…`) while
 * `skinFeaturePreviewData` writes the same locations relative to that root (`ASSETS/…`).
 * Dropping the prefix leaves the segment that already says which tree the file is in —
 * `ASSETS/` for art, `v1/` for chroma images — so neither is hardcoded here. The host only
 * serves the lowercased form; the catalogue's own mixed casing 404s verbatim.
 */
export function cdragonAssetUrl(path: string): string {
  if (!path) return "";
  const lower = path.toLowerCase();
  const relative = lower.startsWith(GAME_DATA_PREFIX)
    ? lower.slice(GAME_DATA_PREFIX.length)
    : lower.replace(/^\/+/, "");
  return `${CDRAGON_ROOT}/${relative}`;
}

// Rarity is game domain, not brand, so these reuse the palette's data hues the way the rank
// colours do rather than introducing a second accent. `kNoRarity` is deliberately absent:
// 832 of 2146 skins carry it, and badging every other card says nothing.
const RARITIES: Record<string, SkinRarity> = {
  kRare: { label: "Rare", toneClass: "border-accent-blue/40 text-accent-blue" },
  kEpic: { label: "Epic", toneClass: "border-rank-master/40 text-rank-master" },
  kLegendary: { label: "Legendary", toneClass: "border-danger/40 text-danger" },
  kMythic: { label: "Mythic", toneClass: "border-info/40 text-info" },
  kUltimate: { label: "Ultimate", toneClass: "border-warning/40 text-warning" },
  kExalted: { label: "Exalted", toneClass: "border-rank-challenger/40 text-rank-challenger" },
  kTranscendent: { label: "Transcendent", toneClass: "border-accent/40 text-accent" },
};

export function skinRarity(raw: string): SkinRarity | null {
  return RARITIES[raw] ?? null;
}
