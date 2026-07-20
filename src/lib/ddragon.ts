import { DDRAGON_VERSION } from "@/lib/ddragonVersion";

export { DDRAGON_VERSION } from "@/lib/ddragonVersion";

// Rune, keystone and summoner-spell icon helpers live in ddragonRunes; re-exported
// here so existing importers of "@/lib/ddragon" keep working.
export {
  runePathIconUrl,
  keystoneIconUrl,
  summonerSpellUrl,
  keystoneIconUrlByName,
  runePathIconUrlByName,
} from "@/lib/ddragonRunes";

const DDRAGON_VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";

// Server-side: returns the live latest Data Dragon version, cached 12h, falling
// back to DDRAGON_VERSION if the version feed is unreachable. Must not be called
// from client components (they cannot await).
export async function getLatestDdragonVersion(): Promise<string> {
  try {
    const res = await fetch(DDRAGON_VERSIONS_URL, { next: { revalidate: 43200 } });
    if (!res.ok) return DDRAGON_VERSION;
    const versions = (await res.json()) as string[];
    return versions[0] ?? DDRAGON_VERSION;
  } catch {
    return DDRAGON_VERSION;
  }
}

// Data Dragon ids are not derivable from display names. Apostrophe champions are
// the worst offenders: Riot lowercases the letter after the apostrophe for some
// (Kai'Sa → Kaisa) and keeps it for others (Kog'Maw → KogMaw), with no rule that
// separates the two. All eight are listed here — including the ones that already
// survive the fallback regex — so editing that regex cannot silently break them.
const CHAMPION_KEY_OVERRIDES: Record<string, string> = {
  Wukong: "MonkeyKing",
  "Nunu & Willump": "Nunu",
  "Renata Glasc": "Renata",
  Fiddlesticks: "Fiddlesticks",
  LeBlanc: "Leblanc",
  "Bel'Veth": "Belveth",
  "Cho'Gath": "Chogath",
  "Kai'Sa": "Kaisa",
  "Kha'Zix": "Khazix",
  "Vel'Koz": "Velkoz",
  "Kog'Maw": "KogMaw",
  "Rek'Sai": "RekSai",
  "K'Sante": "KSante",
};

export function normalizeChampionKey(name: string): string {
  if (CHAMPION_KEY_OVERRIDES[name]) return CHAMPION_KEY_OVERRIDES[name];
  return name.replace(/[' .]/g, "").replace(/&.*/, "").trim();
}

export function championIconUrl(championName: string): string {
  const key = normalizeChampionKey(championName);
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${key}.png`;
}

export function championSplashUrl(championName: string): string {
  const key = normalizeChampionKey(championName);
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${key}_0.jpg`;
}

export function championLoadingUrl(championName: string): string {
  const key = normalizeChampionKey(championName);
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${key}_0.jpg`;
}

export function itemIconUrl(itemId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${itemId}.png`;
}

export function rankEmblemUrl(tier: string): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tier.toLowerCase()}.png`;
}

// Position/role icons — DB stores: TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
export function roleIconUrl(position: string): string {
  const p = position.toLowerCase();
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/position-selector/positions/icon-position-${p}.png`;
}

export function profileIconUrl(iconId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${iconId}.png`;
}

// Ability (spell/passive) icons are versioned; the version is threaded from the
// same fetch that produced the champion detail so icons match the data patch.
export function spellIconUrl(version: string, imageFull: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${imageFull}`;
}

export function passiveIconUrl(version: string, imageFull: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/${imageFull}`;
}

export type AbilitySlot = "P1" | "Q1" | "W1" | "E1" | "R1";

// Official Riot ability preview clips. The numeric champion key is zero-padded to
// four digits (Ahri 103 → 0103); the unpadded form 403s.
export function abilityVideoUrl(championKey: string, slot: AbilitySlot): string {
  const id = championKey.padStart(4, "0");
  return `https://d28xe8vt774jo5.cloudfront.net/champion-abilities/${id}/ability_${id}_${slot}.webm`;
}
