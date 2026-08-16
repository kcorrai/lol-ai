import { POSITION_LABELS } from "@/domains/meta";
import type { ChampionMetaStats, MetaSnapshot, PositionStats } from "@/domains/meta";
import type { RailMatchup } from "./ChampionRail";

const SHOWN = 4;

/** The lane the champion is actually played in this patch — the one with the most games. */
export function primaryPosition(champion: ChampionMetaStats): PositionStats | null {
  return champion.positions.reduce<PositionStats | null>(
    (top, position) => (top === null || position.games > top.games ? position : top),
    null
  );
}

export function laneLabelOf(champion: ChampionMetaStats | null): string | null {
  if (!champion) return null;
  const position = primaryPosition(champion);
  return position ? POSITION_LABELS[position.position] : null;
}

/**
 * The hardest and easiest lane opponents, resolved to routable champions.
 *
 * `counters` arrives sorted hardest-first, so the worst list is the head and the best is the tail
 * reversed. Opponents missing from the snapshot index are dropped rather than rendered unlinkable.
 */
export function railMatchups(
  snapshot: MetaSnapshot | null,
  champion: ChampionMetaStats | null
): { worst: RailMatchup[]; best: RailMatchup[] } {
  const position = champion ? primaryPosition(champion) : null;
  if (!snapshot || !position) return { worst: [], best: [] };

  const index = new Map(snapshot.champions.map((c) => [c.championId, c]));
  const resolved = position.counters
    .map((entry) => {
      const opponent = index.get(entry.opponentId);
      return opponent
        ? { key: opponent.championKey, name: opponent.name, winRate: entry.subjectWinRate }
        : null;
    })
    .filter((m): m is RailMatchup => m !== null);

  return {
    worst: resolved.filter((m) => m.winRate < 50).slice(0, SHOWN),
    best: [...resolved.filter((m) => m.winRate > 50)].reverse().slice(0, SHOWN),
  };
}
