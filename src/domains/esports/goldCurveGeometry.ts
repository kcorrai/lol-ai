import { goldDiff } from "@/domains/esports/timeline";
import type { GameTimeline } from "@/domains/esports/types";

/**
 * Where the gold curve's marks go, kept apart from the SVG that draws them so
 * the arithmetic can be tested without rendering anything.
 */

/** The plotting area inside the SVG's viewBox. */
export interface CurveBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface CurvePoint {
  x: number;
  y: number;
  seconds: number;
  diff: number;
}

/** Never scale to less than this, or a level game draws a dramatic wobble. */
export const MIN_SCALE_GOLD = 2000;

export function curveMid(box: CurveBox): number {
  return (box.top + box.bottom) / 2;
}

/** The x a moment in the game sits at, given how long the curve runs. */
export function timeToX(seconds: number, span: number, box: CurveBox): number {
  return box.left + (seconds / span) * (box.right - box.left);
}

/** The y a gold lead sits at: blue's leads above the middle, red's below. */
export function goldToY(diff: number, scale: number, box: CurveBox): number {
  const mid = curveMid(box);
  return mid - (diff / scale) * (mid - box.top);
}

export function plotGoldCurve(
  timeline: GameTimeline,
  box: CurveBox
): { points: CurvePoint[]; scale: number; span: number } {
  const span = Math.max(...timeline.samples.map((sample) => sample.seconds), 1);
  const scale = Math.max(
    MIN_SCALE_GOLD,
    ...timeline.samples.map((sample) => Math.abs(goldDiff(sample)))
  );

  const points = timeline.samples.map((sample) => {
    const diff = goldDiff(sample);
    return {
      seconds: sample.seconds,
      diff,
      x: timeToX(sample.seconds, span, box),
      y: goldToY(diff, scale, box),
    };
  });

  return { points, scale, span };
}
