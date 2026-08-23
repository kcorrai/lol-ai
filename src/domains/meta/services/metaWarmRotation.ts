import type { CanonicalPosition, MetaSnapshot } from "@/domains/meta/types";

export interface DetailTarget {
  championId: number;
  position: CanonicalPosition;
}

/**
 * Every champion+lane the snapshot actually reports, which is the set of detail variants a page
 * can ask for. Derived from the feed rather than from a champion list, so a lane nobody plays is
 * never warmed and a lane that appears mid-patch is picked up on the next run.
 */
export function detailTargets(snapshot: MetaSnapshot): DetailTarget[] {
  const targets: DetailTarget[] = [];
  for (const champion of snapshot.champions) {
    for (const position of champion.positions) {
      targets.push({ championId: champion.championId, position: position.position });
    }
  }
  return targets.sort(
    (a, b) => a.championId - b.championId || a.position.localeCompare(b.position)
  );
}

/**
 * Which rotation slice a given day falls in. Whole days since the epoch, so the slice advances
 * once per UTC day and every target is refreshed within `slices` days — far inside the 365-day
 * last-good lifetime, and short enough that nothing on the site is ever a week stale.
 */
export function sliceForDay(nowMs: number, slices: number): number {
  const day = Math.floor(nowMs / 86_400_000);
  return ((day % slices) + slices) % slices;
}

/**
 * The slice's share of the targets. Strided rather than chunked: consecutive champion ids land in
 * different slices, so one run never concentrates on a single stretch of the roster and a run that
 * dies halfway leaves gaps spread thin instead of a contiguous hole.
 */
export function targetsInSlice(
  targets: readonly DetailTarget[],
  slice: number,
  slices: number
): DetailTarget[] {
  return targets.filter((_, index) => index % slices === slice);
}
