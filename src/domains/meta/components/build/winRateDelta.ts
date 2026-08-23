/**
 * A build's win rate is close to meaningless on its own.
 *
 * "53.1%" reads as good until you know the champion averages 53.5% in that lane, at which point
 * the build you are being shown is *below* the champion's own baseline. Lolalytics is built on
 * this comparison and no mainstream site shows it; the numbers to compute it were already on the
 * page (LA-71).
 */

/**
 * Below this many games a difference is sampling noise, not a finding.
 *
 * The same threshold the tier list uses to decide a lane is real. A late-item option picked two
 * hundred times can carry a delta; one picked forty times cannot, and dressing that up as
 * "+3.2%" is worse than saying nothing.
 */
export const MIN_DELTA_GAMES = 200;

export interface WinRateDelta {
  /** Percentage points against the champion's own win rate in this lane. */
  points: number;
  /** "+0.6" / "−0.4", with a real minus sign rather than a hyphen. */
  label: string;
  better: boolean;
}

/**
 * How this option compares to simply playing the champion in this lane.
 *
 * Null when the sample is too small to mean anything, or when the difference rounds to nothing —
 * a "+0.0" chip is visual noise that implies a precision the data does not have.
 */
export function winRateDelta(
  optionWinRate: number,
  baselineWinRate: number,
  games: number,
): WinRateDelta | null {
  if (games < MIN_DELTA_GAMES) return null;

  const points = optionWinRate - baselineWinRate;
  const rounded = Math.round(points * 10) / 10;
  if (rounded === 0) return null;

  return {
    points: rounded,
    label: `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(1)}`,
    better: rounded > 0,
  };
}
