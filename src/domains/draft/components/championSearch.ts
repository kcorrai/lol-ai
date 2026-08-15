import type { CanonicalPosition } from "@/domains/meta/types";
import type { DraftChampion } from "@/domains/draft/draftCatalog.types";

/**
 * What people actually type under a 30-second clock. Matching only on the full
 * name means "mf", "asol" and "j4" find nothing, which is the difference between
 * a grid you can use mid-draft and one you scroll.
 */
export const CHAMPION_ALIASES: Record<string, readonly string[]> = {
  aurelionsol: ["asol"],
  missfortune: ["mf"],
  tahmkench: ["tk", "tahm"],
  jarvaniv: ["j4", "jarvan"],
  masteryi: ["yi"],
  twistedfate: ["tf"],
  gangplank: ["gp"],
  monkeyking: ["wukong", "monkey"],
  leblanc: ["lb"],
  mordekaiser: ["morde"],
  cassiopeia: ["cass"],
  malzahar: ["malz"],
  vladimir: ["vlad"],
  blitzcrank: ["blitz"],
  caitlyn: ["cait"],
  sejuani: ["sej"],
  nunu: ["willump"],
  kogmaw: ["kog"],
  reksai: ["rek"],
  khazix: ["kha", "bug"],
  drmundo: ["mundo"],
  evelynn: ["eve"],
  seraphine: ["sera"],
  tristana: ["trist"],
  volibear: ["voli"],
  nidalee: ["nid"],
  pantheon: ["panth"],
  hecarim: ["heca"],
  orianna: ["ori"],
  ezreal: ["ez"],
  warwick: ["ww"],
  amumu: ["mumu"],
  renataglasc: ["renata"],
  fiddlesticks: ["fiddle"],
  heimerdinger: ["heimer"],
  velkoz: ["velkoz"],
  ksante: ["ksante"],
};

/** Lowercase, letters and digits only — so "Kha'Zix" and "Dr. Mundo" match what
 *  someone types without the punctuation. */
export function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function matchesQuery(champion: DraftChampion, query: string): boolean {
  const q = normalise(query);
  if (!q) return true;

  const name = normalise(champion.name);
  const key = normalise(champion.key);
  if (name.includes(q) || key.includes(q)) return true;

  return (CHAMPION_ALIASES[key] ?? []).some((alias) => alias.startsWith(q));
}

export interface GridFilter {
  query: string;
  lane: CanonicalPosition | null;
}

export function filterChampions(
  champions: readonly DraftChampion[],
  filter: GridFilter
): DraftChampion[] {
  return champions.filter((champion) => {
    if (filter.lane && !champion.lanes.includes(filter.lane)) return false;
    return matchesQuery(champion, filter.query);
  });
}
