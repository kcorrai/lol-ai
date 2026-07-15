import { getMetaSnapshot, findChampionStats } from "@/domains/meta/services/metaStatsService";
import { getChampionDetail } from "@/domains/meta/services/championDetailService";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import type { SnapshotTier } from "@/domains/meta/services/opggShared";
import type {
  CanonicalPosition,
  ChampionBuild,
  MatchupEntry,
  MetaSnapshot,
  PositionStats,
} from "@/domains/meta/types";

// One opposing champion in a counter list, enriched for display.
export interface CounterMatchup {
  championId: number;
  championKey: string; // Data Dragon id, for images/routing
  name: string;
  games: number;
  subjectWinRate: number; // subject champion's win rate vs this opponent (0-100)
  opponentWinRate: number; // this opponent's win rate vs the subject (0-100)
}

export interface CounterResult {
  championId: number;
  championKey: string;
  name: string;
  position: CanonicalPosition;
  patch: string;
  fetchedAt: string;
  matchCount?: number;
  overallTier: number;
  availablePositions: CanonicalPosition[];
  stats: PositionStats; // the subject's stats in this lane
  build: ChampionBuild | null; // for the game-length curve + patch trend
  strongAgainstSubject: CounterMatchup[]; // opponents that beat the subject (its counters)
  weakAgainstSubject: CounterMatchup[]; // opponents the subject beats (favourable)
}

const LIST_SIZE = 8;

function buildChampionIndex(
  snapshot: MetaSnapshot
): Map<number, { key: string; name: string }> {
  const index = new Map<number, { key: string; name: string }>();
  for (const c of snapshot.champions) {
    index.set(c.championId, { key: c.championKey, name: c.name });
  }
  return index;
}

function enrichMatchups(
  counters: MatchupEntry[],
  index: Map<number, { key: string; name: string }>
): CounterMatchup[] {
  return counters
    .map((c) => {
      const opp = index.get(c.opponentId);
      if (!opp) return null;
      return {
        championId: c.opponentId,
        championKey: opp.key,
        name: opp.name,
        games: c.games,
        subjectWinRate: c.subjectWinRate,
        opponentWinRate: Math.round((100 - c.subjectWinRate) * 10) / 10,
      };
    })
    .filter((m): m is CounterMatchup => m !== null);
}

// Returns the counter breakdown for a champion in a lane, or null if the champion
// or meta snapshot is unavailable. Position defaults to the champion's most-played
// lane when not supplied. An optional rank bracket narrows the data.
export async function getCounterData(
  championKey: string,
  position?: CanonicalPosition,
  tier?: SnapshotTier
): Promise<CounterResult | null> {
  const snapshot = await getMetaSnapshot({ tier });
  if (!snapshot) return null;

  const champion = findChampionStats(snapshot, championKey);
  if (!champion || champion.positions.length === 0) return null;

  const availablePositions = champion.positions.map((p) => p.position);
  // Default to the lane with the most games.
  const resolvedPosition =
    position && availablePositions.includes(position)
      ? position
      : [...champion.positions].sort((a, b) => b.games - a.games)[0].position;

  const [detail, ddragon] = await Promise.all([
    getChampionDetail(champion.championId, resolvedPosition, { tier }),
    fetchAllChampions(),
  ]);
  if (!detail) return null;

  // Merge the snapshot index with a Data Dragon fallback so opponents that op.gg
  // lists but the snapshot omits (new or low-sample champions) still resolve
  // instead of silently vanishing from the counter lists.
  const index = buildChampionIndex(snapshot);
  for (const c of ddragon) {
    const numericKey = Number(c.key);
    if (!Number.isNaN(numericKey) && !index.has(numericKey)) {
      index.set(numericKey, { key: c.id, name: c.name });
    }
  }
  const matchups = enrichMatchups(detail.counters, index);

  // counters are pre-sorted ascending by subject win rate (hardest first). The
  // exact-50.0 boundary belongs in one column, not dropped from both.
  const strongAgainstSubject = matchups
    .filter((m) => m.subjectWinRate < 50)
    .slice(0, LIST_SIZE);
  const weakAgainstSubject = matchups
    .filter((m) => m.subjectWinRate >= 50)
    .sort((a, b) => b.subjectWinRate - a.subjectWinRate)
    .slice(0, LIST_SIZE);

  const stats = champion.positions.find((p) => p.position === resolvedPosition)!;

  return {
    championId: champion.championId,
    championKey: champion.championKey,
    name: champion.name,
    position: resolvedPosition,
    patch: snapshot.patch,
    fetchedAt: snapshot.fetchedAt,
    matchCount: snapshot.matchCount,
    overallTier: champion.overallTier,
    availablePositions,
    stats,
    build: detail.build,
    strongAgainstSubject,
    weakAgainstSubject,
  };
}
