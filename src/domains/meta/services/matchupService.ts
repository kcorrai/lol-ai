import {
  getMetaSnapshot,
  findChampionStats,
  getChampionCounters,
} from "@/domains/meta/services/metaStatsService";
import { fetchAllChampions, type DdragonChampionSummary } from "@/lib/ddragon/championsData";
import type { CanonicalPosition, ChampionMetaStats } from "@/domains/meta/types";

export interface MatchupReport {
  championA: { key: string; name: string };
  championB: { key: string; name: string };
  position: CanonicalPosition;
  patch: string;
  aWinRateVsB: number; // 0-100
  games: number; // matchup sample size (0 = not enough data)
  verdict: "favored" | "even" | "unfavored"; // from A's perspective
  hints: string[];
}

const RANGE_DIFF_THRESHOLD = 75;

function resolvePosition(
  a: ChampionMetaStats,
  b: ChampionMetaStats,
  requested?: CanonicalPosition
): CanonicalPosition | null {
  const aPositions = a.positions.map((p) => p.position);
  const bPositions = new Set(b.positions.map((p) => p.position));
  const shared = aPositions.filter((p) => bPositions.has(p));

  if (requested && shared.includes(requested)) return requested;
  if (requested && aPositions.includes(requested)) return requested;
  if (shared.length > 0) {
    // most-played shared lane (a.positions is not sorted, so compare games)
    return [...a.positions]
      .filter((p) => bPositions.has(p.position))
      .sort((x, y) => y.games - x.games)[0].position;
  }
  if (a.positions.length === 0) return null;
  return [...a.positions].sort((x, y) => y.games - x.games)[0].position;
}

async function lookupWinRate(
  a: ChampionMetaStats,
  b: ChampionMetaStats,
  position: CanonicalPosition
): Promise<{ winRate: number; games: number }> {
  const aCounters = await getChampionCounters(a.championId, position);
  const direct = aCounters?.find((c) => c.opponentId === b.championId);
  if (direct) return { winRate: direct.subjectWinRate, games: direct.games };

  // Fall back to the inverse matchup from B's data.
  const bCounters = await getChampionCounters(b.championId, position);
  const inverse = bCounters?.find((c) => c.opponentId === a.championId);
  if (inverse) {
    return { winRate: Math.round((100 - inverse.subjectWinRate) * 10) / 10, games: inverse.games };
  }
  return { winRate: 50, games: 0 };
}

function buildHints(a: DdragonChampionSummary, b: DdragonChampionSummary): string[] {
  const hints: string[] = [];

  const rangeDiff = a.stats.attackrange - b.stats.attackrange;
  if (rangeDiff >= RANGE_DIFF_THRESHOLD) {
    hints.push(
      `${a.name} out-ranges ${b.name} — use auto-attacks and abilities to poke, and avoid extended trades once ${b.name} closes the gap.`
    );
  } else if (rangeDiff <= -RANGE_DIFF_THRESHOLD) {
    hints.push(
      `${b.name} out-ranges ${a.name} — expect to take poke; look for trades only when ${b.name}'s key abilities are on cooldown.`
    );
  }

  if (a.tags.includes("Assassin")) {
    hints.push(
      `${a.name} spikes at level 6 — track its ultimate and play around the wave to survive the all-in window.`
    );
  }
  if (b.tags.includes("Assassin")) {
    hints.push(
      `${b.name} is an assassin — ward for roams and buy defensive items early if you fall behind.`
    );
  }
  if (a.info.difficulty >= 8) {
    hints.push(`${a.name} is mechanically demanding — practice its combos before first-picking it into this lane.`);
  }

  if (hints.length === 0) {
    hints.push(`Trade when your key cooldowns are up and ${b.name}'s are down, and track wave state to deny all-ins.`);
  }
  return hints.slice(0, 3);
}

function verdictFor(winRate: number, games: number): MatchupReport["verdict"] {
  if (games === 0) return "even";
  if (winRate >= 52) return "favored";
  if (winRate <= 48) return "unfavored";
  return "even";
}

// Head-to-head report for champion A against champion B in a lane, or null if the
// snapshot or either champion is unavailable.
export async function getMatchupData(
  championAKey: string,
  championBKey: string,
  requestedPosition?: CanonicalPosition
): Promise<MatchupReport | null> {
  const [snapshot, summaries] = await Promise.all([getMetaSnapshot(), fetchAllChampions()]);
  if (!snapshot) return null;

  const a = findChampionStats(snapshot, championAKey);
  const b = findChampionStats(snapshot, championBKey);
  if (!a || !b) return null;

  const position = resolvePosition(a, b, requestedPosition);
  if (!position) return null;

  const { winRate, games } = await lookupWinRate(a, b, position);

  const summaryByKey = new Map(summaries.map((s) => [s.id.toLowerCase(), s]));
  const aSummary = summaryByKey.get(a.championKey.toLowerCase());
  const bSummary = summaryByKey.get(b.championKey.toLowerCase());

  return {
    championA: { key: a.championKey, name: a.name },
    championB: { key: b.championKey, name: b.name },
    position,
    patch: snapshot.patch,
    aWinRateVsB: winRate,
    games,
    verdict: verdictFor(winRate, games),
    hints: aSummary && bSummary ? buildHints(aSummary, bSummary) : [],
  };
}
