/**
 * How lopsided a matchup is, regardless of which side it favours.
 *
 * Bars are drawn from this rather than from the win rate itself so that both columns mean the same
 * thing: a long bar is a strong signal. Scaling the red column by raw win rate instead would give
 * the *worst* matchup the shortest bar and make the list appear to grow as it gets safer.
 */
export function matchupEdge(winRate: number): number {
  return Math.abs(winRate - 50);
}

/** Narrowest a bar may render, so a row at the bottom of the range is still visibly a bar. */
const MIN_WIDTH = 12;
const MAX_WIDTH = 100;

/**
 * Bar width for one row, as a percentage, given every value in that column.
 *
 * Scaled across the column's own range rather than 0-100: matchup edges cluster within a few
 * points, so an absolute scale would draw every bar at roughly the same width and show nothing.
 * Stretching the visible range is what makes the ordering readable at a glance.
 *
 * The number beside the bar remains the real win rate — the bar is a relative cue, not the value.
 */
export function barWidth(value: number, values: number[]): number {
  if (values.length === 0) return MIN_WIDTH;

  const min = Math.min(...values);
  const max = Math.max(...values);

  // Every row identical (or a single row): there is no relative difference to draw, so they all
  // get the same full bar rather than an arbitrary fraction — and no division by zero below.
  if (max === min) return MAX_WIDTH;

  const scaled = MIN_WIDTH + ((value - min) / (max - min)) * (MAX_WIDTH - MIN_WIDTH);
  return Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, scaled)));
}
