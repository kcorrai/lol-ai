import { getMetaSnapshot } from "@/domains/meta/services/metaStatsService";
import type { ChampionMetaStats } from "@/domains/meta/types";

// One champion whose overall rank moved between patches.
export interface MetaMover {
  championKey: string;
  name: string;
  rank: number;
  prevPatchRank: number;
  delta: number; // prevPatchRank - rank (positive = climbed)
  winRate: number; // 0-100
  pickRate: number; // 0-100
  banRate: number; // 0-100
  games: number; // total games this patch (sample size)
  tier: number; // 1 (best) .. 5
}

export interface MetaReport {
  patch: string; // raw Data Dragon version, e.g. "16.14"
  fetchedAt: string; // ISO timestamp of the snapshot
  matchCount?: number; // ranked games analyzed this patch
  climbers: MetaMover[]; // biggest risers, best first
  fallers: MetaMover[]; // biggest fallers, worst first
}

// Ignore near-zero pick rates so the report reflects real meta shifts, not noise
// from off-meta picks that swing dozens of ranks on a handful of games.
const MIN_PICK_RATE = 0.5;
const MIN_RANK_DELTA = 3;

function toMover(c: ChampionMetaStats): MetaMover {
  return {
    championKey: c.championKey,
    name: c.name,
    rank: c.overallRank,
    prevPatchRank: c.prevPatchRank,
    delta: c.prevPatchRank - c.overallRank,
    winRate: c.overallWinRate,
    pickRate: c.overallPickRate,
    banRate: c.overallBanRate,
    games: c.overallGames,
    tier: c.overallTier,
  };
}

// Weight rank movement by how often the champion is actually picked, so a 20-rank
// swing on a popular pick outranks the same swing on a fringe one.
function weight(m: MetaMover): number {
  return m.delta * Math.sqrt(m.pickRate);
}

// Returns the patch's biggest climbers and fallers by weighted rank movement, or
// null if the snapshot is unavailable.
export async function getMetaReport(limit = 10): Promise<MetaReport | null> {
  const snapshot = await getMetaSnapshot();
  if (!snapshot) return null;

  const movers = snapshot.champions
    .filter(
      (c) => c.overallRank > 0 && c.prevPatchRank > 0 && c.overallPickRate >= MIN_PICK_RATE
    )
    .map(toMover)
    .filter((m) => Math.abs(m.delta) >= MIN_RANK_DELTA);

  const climbers = movers
    .filter((m) => m.delta > 0)
    .sort((a, b) => weight(b) - weight(a))
    .slice(0, limit);

  const fallers = movers
    .filter((m) => m.delta < 0)
    .sort((a, b) => weight(a) - weight(b))
    .slice(0, limit);

  return {
    patch: snapshot.patch,
    fetchedAt: snapshot.fetchedAt,
    matchCount: snapshot.matchCount,
    climbers,
    fallers,
  };
}
