// Interval algebra over instants. No timezones, no calendars, no domain.
//
// Split out of `slots.ts` because it is a different kind of thinking: this is
// arithmetic on ranges, and the thing that calls it is a scheduling problem.
// It is also where the off-by-one lives if there is one, so it is worth being
// able to test on its own.

/** A half-open range: `start` is included, `end` is not. */
export interface Interval {
  start: Date;
  end: Date;
}

/**
 * Merge overlapping or touching intervals.
 *
 * Touching counts as overlapping — two windows that meet at 12:00 are one
 * window, and treating them as two would refuse a session that spans the join.
 */
export function merge(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Interval[] = [];

  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start.getTime() <= last.end.getTime()) {
      if (interval.end.getTime() > last.end.getTime()) last.end = interval.end;
      continue;
    }
    merged.push({ start: interval.start, end: interval.end });
  }

  return merged;
}

/** Everything in `windows` that is not in `busy`. */
export function subtractAll(windows: Interval[], busy: Interval[]): Interval[] {
  const blocked = merge(busy);
  let remaining = windows;

  for (const block of blocked) {
    remaining = remaining.flatMap((window) => subtractOne(window, block));
  }

  return remaining;
}

/** One window minus one block: nothing, the window, or one or two pieces of it. */
export function subtractOne(window: Interval, block: Interval): Interval[] {
  const ws = window.start.getTime();
  const we = window.end.getTime();
  const bs = block.start.getTime();
  const be = block.end.getTime();

  if (be <= ws || bs >= we) return [window];

  const pieces: Interval[] = [];
  if (bs > ws) pieces.push({ start: window.start, end: new Date(bs) });
  if (be < we) pieces.push({ start: new Date(be), end: window.end });
  return pieces;
}
