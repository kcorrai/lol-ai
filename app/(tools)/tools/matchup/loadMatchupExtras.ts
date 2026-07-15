import { getMetaSnapshot, findChampionStats, getChampionBuild } from "@/domains/meta";
import type { CanonicalPosition, ChampionBuild, GameLengthPoint } from "@/domains/meta";
import { fetchItems, type ItemInfo } from "@/lib/ddragon/itemsData";
import { fetchRunes, type RuneInfo } from "@/lib/ddragon/runesData";

export interface MatchupSideBuild {
  summonerSpellIds: number[];
  keystone: RuneInfo | null;
  coreItems: ItemInfo[];
  boots: ItemInfo[];
  situationalItems: ItemInfo[]; // top later-slot options to adapt into the matchup
  skillMaxOrder: string[]; // ability max priority, e.g. ["Q","W","E"]
  curve: GameLengthPoint[];
}

export interface MatchupExtras {
  a: MatchupSideBuild;
  b: MatchupSideBuild;
}

function toSide(
  build: ChampionBuild | null,
  items: Map<number, ItemInfo>,
  runes: Map<number, RuneInfo>
): MatchupSideBuild {
  const mapItems = (ids: number[]): ItemInfo[] =>
    ids.map((id) => items.get(id)).filter((i): i is ItemInfo => Boolean(i));
  // Each late option is a single-item slot — take its top pick, capped to a few.
  const situationalIds = (build?.lateItemOptions ?? [])
    .map((o) => o.ids[0])
    .filter((id): id is number => typeof id === "number")
    .slice(0, 4);
  const keystoneId = build?.runes?.primaryRuneIds[0];
  return {
    summonerSpellIds: build?.summonerSpellIds ?? [],
    keystone: keystoneId ? runes.get(keystoneId) ?? null : null,
    coreItems: mapItems(build?.coreItems?.ids ?? []),
    boots: mapItems(build?.boots?.ids ?? []),
    situationalItems: mapItems(situationalIds),
    skillMaxOrder: build?.skillMaxOrder ?? [],
    curve: build?.gameLengths ?? [],
  };
}

// Loads both champions' core items, keystone and game-length curve for the matchup
// tool's build mini-summary. Returns null if the snapshot or a champion is missing.
export async function loadMatchupExtras(
  aKey: string,
  bKey: string,
  position: CanonicalPosition
): Promise<MatchupExtras | null> {
  const snapshot = await getMetaSnapshot();
  if (!snapshot) return null;

  const a = findChampionStats(snapshot, aKey);
  const b = findChampionStats(snapshot, bKey);
  if (!a || !b) return null;

  const [buildA, buildB, items, runes] = await Promise.all([
    getChampionBuild(a.championId, position),
    getChampionBuild(b.championId, position),
    fetchItems(),
    fetchRunes(),
  ]);

  return { a: toSide(buildA, items, runes), b: toSide(buildB, items, runes) };
}
