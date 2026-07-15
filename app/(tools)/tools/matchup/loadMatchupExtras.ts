import { getMetaSnapshot, findChampionStats, getChampionBuild } from "@/domains/meta";
import type { CanonicalPosition, ChampionBuild, GameLengthPoint } from "@/domains/meta";
import { fetchItems, type ItemInfo } from "@/lib/ddragon/itemsData";
import { fetchRunes, type RuneInfo } from "@/lib/ddragon/runesData";

export interface MatchupSideBuild {
  coreItems: ItemInfo[];
  keystone: RuneInfo | null;
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
  const coreItems = (build?.coreItems?.ids ?? [])
    .map((id) => items.get(id))
    .filter((i): i is ItemInfo => Boolean(i));
  const keystoneId = build?.runes?.primaryRuneIds[0];
  return {
    coreItems,
    keystone: keystoneId ? runes.get(keystoneId) ?? null : null,
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
