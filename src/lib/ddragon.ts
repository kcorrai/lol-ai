// Synchronous fallback used by client components to build patch-versioned image
// URLs. Keep this reasonably current; server code that needs the exact live patch
// should await getLatestDdragonVersion() instead.
export const DDRAGON_VERSION = "16.13.1";

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

const CHAMPION_KEY_OVERRIDES: Record<string, string> = {
  Wukong: "MonkeyKing",
  "Nunu & Willump": "Nunu",
  "Renata Glasc": "Renata",
  Fiddlesticks: "Fiddlesticks",
  LeBlanc: "Leblanc",
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

const SUMMONER_SPELL_NAMES: Record<number, string> = {
  1: "SummonerBoost",
  3: "SummonerExhaust",
  4: "SummonerFlash",
  6: "SummonerHaste",
  7: "SummonerHeal",
  11: "SummonerSmite",
  12: "SummonerTeleport",
  13: "SummonerMana",
  14: "SummonerDot",
  21: "SummonerBarrier",
  30: "SummonerPoroRecall",
  32: "SummonerSnowball",
  39: "SummonerCherry",
};

const RUNE_PATH_ICONS: Record<number, string> = {
  8000: "7201_Precision",
  8100: "7200_Domination",
  8200: "7202_Sorcery",
  8300: "7203_Whimsy",
  8400: "7204_Resolve",
};

export function runePathIconUrl(styleId: number): string {
  const name = RUNE_PATH_ICONS[styleId];
  if (!name) return "";
  return `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${name}.png`;
}

const KEYSTONE_PATHS: Record<number, string> = {
  8005: "Styles/Precision/PressTheAttack/PressTheAttack.png",
  8008: "Styles/Precision/LethalTempo/LethalTempoTemp.png",
  8021: "Styles/Precision/FleetFootwork/FleetFootwork.png",
  8010: "Styles/Precision/Conqueror/Conqueror.png",
  9101: "Styles/Domination/Electrocute/Electrocute.png",
  9111: "Styles/Domination/Predator/Predator.png",
  8128: "Styles/Domination/DarkHarvest/DarkHarvest.png",
  9923: "Styles/Domination/HailOfBlades/HailOfBlades.png",
  8214: "Styles/Sorcery/SummonAery/SummonAery.png",
  8229: "Styles/Sorcery/ArcaneComet/ArcaneComet.png",
  8230: "Styles/Sorcery/PhaseRush/PhaseRush.png",
  8351: "Styles/Inspiration/GlacialAugment/GlacialAugment.png",
  8360: "Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png",
  8369: "Styles/Inspiration/FirstStrike/FirstStrike.png",
  8465: "Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png",
  8439: "Styles/Resolve/VeteranAftershock/VeteranAftershock.png",
  8242: "Styles/Resolve/Guardian/Guardian.png",
};

export function keystoneIconUrl(perkId: number): string {
  const path = KEYSTONE_PATHS[perkId];
  if (!path) return "";
  return `https://ddragon.leagueoflegends.com/cdn/img/perk-images/${path}`;
}

export function summonerSpellUrl(spellId: number): string {
  const name = SUMMONER_SPELL_NAMES[spellId];
  if (!name) return "";
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/spell/${name}.png`;
}

export function profileIconUrl(iconId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${iconId}.png`;
}

const KEYSTONE_ID_BY_NAME: Record<string, number> = {
  "Press the Attack": 8005,
  "Lethal Tempo": 8008,
  "Fleet Footwork": 8021,
  Conqueror: 8010,
  Electrocute: 9101,
  Predator: 9111,
  "Dark Harvest": 8128,
  "Hail of Blades": 9923,
  "Summon Aery": 8214,
  "Arcane Comet": 8229,
  "Phase Rush": 8230,
  "Glacial Augment": 8351,
  "Unsealed Spellbook": 8360,
  "First Strike": 8369,
  "Grasp of the Undying": 8465,
  Aftershock: 8439,
  Guardian: 8242,
};

const RUNE_PATH_ID_BY_NAME: Record<string, number> = {
  Precision: 8000,
  Domination: 8100,
  Sorcery: 8200,
  Inspiration: 8300,
  Resolve: 8400,
};

export function keystoneIconUrlByName(name: string): string {
  const id = KEYSTONE_ID_BY_NAME[name];
  return id ? keystoneIconUrl(id) : "";
}

export function runePathIconUrlByName(name: string): string {
  const id = RUNE_PATH_ID_BY_NAME[name];
  return id ? runePathIconUrl(id) : "";
}
