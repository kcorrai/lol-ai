import { getMetaSnapshot, findChampionStats } from "@/domains/meta/services/metaStatsService";
import { getChampionCounters } from "@/domains/meta/services/championDetailService";
import type { CanonicalPosition, MatchupEntry, MetaSnapshot } from "@/domains/meta/types";

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
  championKey: string;
  name: string;
  position: CanonicalPosition;
  patch: string;
  availablePositions: CanonicalPosition[];
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
// lane when not supplied.
export async function getCounterData(
  championKey: string,
  position?: CanonicalPosition
): Promise<CounterResult | null> {
  const snapshot = await getMetaSnapshot();
  if (!snapshot) return null;

  const champion = findChampionStats(snapshot, championKey);
  if (!champion || champion.positions.length === 0) return null;

  const availablePositions = champion.positions.map((p) => p.position);
  // Default to the lane with the most games.
  const resolvedPosition =
    position && availablePositions.includes(position)
      ? position
      : [...champion.positions].sort((a, b) => b.games - a.games)[0].position;

  const counters = await getChampionCounters(champion.championId, resolvedPosition);
  if (!counters) return null;

  const index = buildChampionIndex(snapshot);
  const matchups = enrichMatchups(counters, index);

  // counters are pre-sorted ascending by subject win rate (hardest first).
  const strongAgainstSubject = matchups
    .filter((m) => m.subjectWinRate < 50)
    .slice(0, LIST_SIZE);
  const weakAgainstSubject = matchups
    .filter((m) => m.subjectWinRate > 50)
    .sort((a, b) => b.subjectWinRate - a.subjectWinRate)
    .slice(0, LIST_SIZE);

  return {
    championKey: champion.championKey,
    name: champion.name,
    position: resolvedPosition,
    patch: snapshot.patch,
    availablePositions,
    strongAgainstSubject,
    weakAgainstSubject,
  };
}
