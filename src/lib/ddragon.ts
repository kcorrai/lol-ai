export const DDRAGON_VERSION = "15.14.1";

// Riot match API v5 returns display names with spaces/apostrophes; DDragon keys differ
const CHAMPION_KEY_OVERRIDES: Record<string, string> = {
  Wukong: "MonkeyKing",
  "Nunu & Willump": "Nunu",
  "Renata Glasc": "Renata",
  Fiddlesticks: "Fiddlesticks",
};

export function normalizeChampionKey(name: string): string {
  if (CHAMPION_KEY_OVERRIDES[name]) return CHAMPION_KEY_OVERRIDES[name];
  // Strip spaces, apostrophes, periods — e.g. "Lee Sin"→"LeeSin", "Kai'Sa"→"KaiSa"
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
