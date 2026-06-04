export const DDRAGON_VERSION = "15.14.1";

const CHAMPION_KEY_OVERRIDES: Record<string, string> = {
  Wukong: "MonkeyKing",
  "Nunu & Willump": "Nunu",
  "Renata Glasc": "Renata",
  Fiddlesticks: "Fiddlesticks",
};

export function normalizeChampionKey(name: string): string {
  if (CHAMPION_KEY_OVERRIDES[name]) return CHAMPION_KEY_OVERRIDES[name];
  return name.replace(/[' .]/g, "").replace(/&.*/, "").trim();
}

export function championIconUrl(championName: string): string {
  const key = normalizeChampionKey(championName);
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${key}.png`;
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

export function summonerSpellUrl(spellId: number): string {
  const name = SUMMONER_SPELL_NAMES[spellId];
  if (!name) return "";
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/spell/${name}.png`;
}
