export interface DdragonChampionSummary {
  id: string;      // e.g. "Ahri"
  key: string;     // numeric string e.g. "103"
  name: string;    // display name e.g. "Ahri"
  title: string;
  tags: string[];  // ["Mage", "Assassin"]
  info: { attack: number; defense: number; magic: number; difficulty: number };
  stats: {
    hp: number; hpperlevel: number;
    armor: number; armorperlevel: number;
    spellblock: number; spellblockperlevel: number;
    attackdamage: number; attackdamageperlevel: number;
    attackrange: number; movespeed: number;
  };
  blurb: string;
}

export interface DdragonSpell {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  cooldownBurn: string;
  costBurn: string;
  rangeBurn: string;
  image: { full: string };
}

export interface DdragonSkin {
  id: string;
  num: number;
  name: string;
  chromas: boolean;
}

export interface DdragonChampionDetail extends DdragonChampionSummary {
  lore: string;
  allytips: string[];
  enemytips: string[];
  spells: DdragonSpell[];
  passive: { name: string; description: string; image: { full: string } };
  skins: DdragonSkin[];
}

import { getLatestDdragonVersion } from "@/lib/ddragon";

// Data Dragon ability text carries `{{ var }}` template placeholders and HTML
// markup (<br>, <font>, <scaleAP> …). Strip both to plain, readable prose.
export function cleanAbilityText(raw: string): string {
  return raw
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchAllChampions(): Promise<DdragonChampionSummary[]> {
  const version = await getLatestDdragonVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
    { next: { revalidate: 86400 } }
  );
  const json = (await res.json()) as { data: Record<string, DdragonChampionSummary> };
  return Object.values(json.data);
}

export async function fetchChampionDetail(id: string): Promise<DdragonChampionDetail | null> {
  const version = await getLatestDdragonVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${id}.json`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { data: Record<string, DdragonChampionDetail> };
  const detail = Object.values(json.data)[0];
  return detail ?? null;
}
