import {
  getMetaSnapshot,
  findChampionStats,
  getMatchupData,
  getChampionBuild,
  formatGamePatch,
  POSITION_LABELS,
} from "@/domains/meta";
import type { GameLengthPoint, MatchupReport } from "@/domains/meta";
import { fetchItems } from "@/lib/ddragon/itemsData";

export interface MatchupPageData {
  a: { key: string; name: string };
  b: { key: string; name: string };
  laneLabel: string;
  gamePatch: string;
  aWinRate: number;
  games: number;
  verdict: MatchupReport["verdict"];
  hints: string[];
  curveA: GameLengthPoint[];
  curveB: GameLengthPoint[];
  coreA: string[];
  coreB: string[];
}

const coreNames = (ids: number[] | undefined, items: Map<number, { name: string }>): string[] =>
  (ids ?? []).map((id) => items.get(id)?.name).filter((n): n is string => Boolean(n));

// Loads a head-to-head page for two champion keys (alphabetical order). Returns
// null if either champion or the matchup data is unavailable.
export async function loadMatchupData(
  firstKey: string,
  secondKey: string
): Promise<MatchupPageData | null> {
  const snapshot = await getMetaSnapshot();
  if (!snapshot) return null;

  const a = findChampionStats(snapshot, firstKey);
  const b = findChampionStats(snapshot, secondKey);
  if (!a || !b) return null;

  const report = await getMatchupData(a.championKey, b.championKey);
  if (!report) return null;

  const [buildA, buildB, items] = await Promise.all([
    getChampionBuild(a.championId, report.position),
    getChampionBuild(b.championId, report.position),
    fetchItems(),
  ]);

  return {
    a: { key: a.championKey, name: a.name },
    b: { key: b.championKey, name: b.name },
    laneLabel: POSITION_LABELS[report.position],
    gamePatch: formatGamePatch(report.patch),
    aWinRate: report.aWinRateVsB,
    games: report.games,
    verdict: report.verdict,
    hints: report.hints,
    curveA: buildA?.gameLengths ?? [],
    curveB: buildB?.gameLengths ?? [],
    coreA: coreNames(buildA?.coreItems?.ids, items),
    coreB: coreNames(buildB?.coreItems?.ids, items),
  };
}
