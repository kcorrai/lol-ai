import { POSITION_LABELS } from "@/domains/meta";
import type { ChampionMetaStats } from "@/domains/meta";

// Shared derivations for the champion index, kept out of the pages so /builds and /champions
// read the same numbers the same way.

/** A champion with too few games has a noisy rank; a two-place wobble there is not a story. */
const MOVER_MIN_GAMES = 5_000;
const MOVERS_SHOWN = 4;

/** The lane a champion is actually played in — the one with the most games this patch. */
export function championLane(champion: ChampionMetaStats): string {
  const best = champion.positions.reduce<ChampionMetaStats["positions"][number] | null>(
    (top, position) => (top === null || position.games > top.games ? position : top),
    null
  );
  return best ? POSITION_LABELS[best.position] : "Flex";
}

/** Whole hours since an ISO timestamp; 0 when the snapshot is somehow in the future. */
export function hoursAgo(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.round((Date.now() - then) / 3_600_000));
}

/**
 * The champions whose rank moved most since last patch.
 *
 * `prevPatchRank` is 0 when the feed had no ranking last patch, which is not a move — those are
 * dropped rather than counted as a climb from nowhere.
 */
export function championMovers(champions: ChampionMetaStats[]): ChampionMetaStats[] {
  return [...champions]
    .filter((c) => c.prevPatchRank > 0 && c.overallGames >= MOVER_MIN_GAMES)
    .sort(
      (a, b) =>
        Math.abs(b.prevPatchRank - b.overallRank) - Math.abs(a.prevPatchRank - a.overallRank)
    )
    .slice(0, MOVERS_SHOWN);
}
