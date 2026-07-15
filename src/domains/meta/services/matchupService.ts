import { getMetaSnapshot, findChampionStats } from "@/domains/meta/services/metaStatsService";
import { getChampionCounters } from "@/domains/meta/services/championDetailService";
import { fetchAllChampions, type DdragonChampionSummary } from "@/lib/ddragon/championsData";
import type { CanonicalPosition, ChampionMetaStats } from "@/domains/meta/types";

export interface MatchupReport {
  championA: { key: string; name: string };
  championB: { key: string; name: string };
  position: CanonicalPosition;
  availablePositions: CanonicalPosition[]; // lanes both champions share (for the lane selector)
  patch: string;
  aWinRateVsB: number; // 0-100
  games: number; // matchup sample size (0 = not enough data)
  verdict: "favored" | "even" | "unfavored"; // from A's perspective
  hints: string[];
}

const RANGE_DIFF_THRESHOLD = 75;
// A matchup needs a real sample before its win rate is worth acting on in a hint.
const HINT_MIN_GAMES = 100;

// Lanes both champions play, plus the resolved lane to analyze. `requested` is
// honored only when both champions share it; otherwise falls back to the
// most-played shared lane (so we never query a lane one champion doesn't play),
// then to A's most-played lane. Returns null only when A has no lanes at all.
function resolvePosition(
  a: ChampionMetaStats,
  b: ChampionMetaStats,
  requested?: CanonicalPosition
): { position: CanonicalPosition; shared: CanonicalPosition[] } | null {
  const bPositions = new Set(b.positions.map((p) => p.position));
  const sharedStats = [...a.positions]
    .filter((p) => bPositions.has(p.position))
    .sort((x, y) => y.games - x.games);
  const shared = sharedStats.map((p) => p.position);

  if (requested && shared.includes(requested)) return { position: requested, shared };
  if (sharedStats.length > 0) return { position: sharedStats[0].position, shared };
  if (a.positions.length === 0) return null;
  const fallback = [...a.positions].sort((x, y) => y.games - x.games)[0].position;
  return { position: fallback, shared: [fallback] };
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

function buildHints(
  a: DdragonChampionSummary,
  b: DdragonChampionSummary,
  winRate: number,
  games: number
): string[] {
  const hints: string[] = [];

  // Lead with the actual matchup result when the sample is meaningful.
  if (games >= HINT_MIN_GAMES) {
    if (winRate >= 52) {
      hints.push(
        `${a.name} wins this lane ${winRate.toFixed(1)}% of the time — you have a real edge, so look to trade and press your advantage.`
      );
    } else if (winRate <= 48) {
      hints.push(
        `${a.name} wins only ${winRate.toFixed(1)}% into ${b.name} — play safe, prioritise farm, and scale rather than forcing early fights.`
      );
    } else {
      hints.push(
        `${a.name} vs ${b.name} is close to even (${winRate.toFixed(1)}%) — the lane comes down to who plays the wave and cooldowns better.`
      );
    }
  }

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

  const resolved = resolvePosition(a, b, requestedPosition);
  if (!resolved) return null;
  const { position, shared } = resolved;

  const { winRate, games } = await lookupWinRate(a, b, position);

  const summaryByKey = new Map(summaries.map((s) => [s.id.toLowerCase(), s]));
  const aSummary = summaryByKey.get(a.championKey.toLowerCase());
  const bSummary = summaryByKey.get(b.championKey.toLowerCase());

  return {
    championA: { key: a.championKey, name: a.name },
    championB: { key: b.championKey, name: b.name },
    position,
    availablePositions: shared,
    patch: snapshot.patch,
    aWinRateVsB: winRate,
    games,
    verdict: verdictFor(winRate, games),
    hints: aSummary && bSummary ? buildHints(aSummary, bSummary, winRate, games) : [],
  };
}
