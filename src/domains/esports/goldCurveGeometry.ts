import { goldDiff, objectiveEvents } from "@/domains/esports/timeline";
import type { ObjectiveKind } from "@/domains/esports/timeline";
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

export interface GoldTick {
  gold: number;
  label: string;
}

/**
 * The scale rounded up to a whole thousand, so the axis reads "+4k" rather
 * than "+3.7k" and the half-way tick lands on a number people say out loud.
 */
export function niceGoldScale(largestLead: number): number {
  return Math.max(MIN_SCALE_GOLD, Math.ceil(largestLead / 1000) * 1000);
}

/** "+2k", "−1.5k", "0" — signed by who is ahead, blue positive. */
export function formatGoldK(gold: number): string {
  if (gold === 0) return "0";
  const thousands = Math.round((Math.abs(gold) / 1000) * 10) / 10;
  return `${gold > 0 ? "+" : "−"}${thousands}k`;
}

/** Five marks down the axis: both extremes, both halves, and level. */
export function goldTicks(scale: number): GoldTick[] {
  return [scale, scale / 2, 0, -scale / 2, -scale].map((gold) => ({
    gold,
    label: formatGoldK(gold),
  }));
}

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
  const scale = niceGoldScale(
    Math.max(...timeline.samples.map((sample) => Math.abs(goldDiff(sample))))
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

export interface ObjectiveMarker {
  key: string;
  x: number;
  seconds: number;
  side: "blue" | "red";
  kind: ObjectiveKind;
  count: number;
}

/** The least distance between two markers' centres in one row, in viewBox units. */
export const MARKER_GAP = 20;

/**
 * Spreads one row of markers so no two overlap and none leaves the chart.
 *
 * Objectives cluster late in a game — a sample can hold two towers and an
 * inhibitor, and the next sample four minutes on is barely wider than that
 * group — so a marker that would land on its neighbour is pushed right, and a
 * row pushed past the right edge is then walked back left.
 */
function spread(xs: number[], box: CurveBox): number[] {
  const inset = MARKER_GAP / 2;
  const out = [...xs];
  for (let i = 0; i < out.length; i += 1) {
    const floor = i === 0 ? box.left + inset : out[i - 1] + MARKER_GAP;
    out[i] = Math.max(out[i], floor);
  }
  for (let i = out.length - 1; i >= 0; i -= 1) {
    const ceiling = i === out.length - 1 ? box.right - inset : out[i + 1] - MARKER_GAP;
    out[i] = Math.min(out[i], ceiling);
  }
  return out;
}

/**
 * One marker per objective event, at the sample it was first seen in, laid
 * out in a row per side. Markers sharing a sample start fanned around that
 * sample's x before the row is spread.
 */
export function objectiveMarkers(
  timeline: GameTimeline,
  span: number,
  box: CurveBox
): ObjectiveMarker[] {
  const events = objectiveEvents(timeline);

  return (["blue", "red"] as const).flatMap((side) => {
    const row = events.filter((event) => event.side === side);
    const wanted = row.map((event) => {
      const group = row.filter((other) => other.seconds === event.seconds);
      const index = group.indexOf(event);
      return timeToX(event.seconds, span, box) + (index - (group.length - 1) / 2) * MARKER_GAP;
    });
    const xs = spread(wanted, box);

    return row.map((event, index) => ({
      key: `${side}:${index}`,
      x: xs[index],
      seconds: event.seconds,
      side,
      kind: event.kind,
      count: event.count,
    }));
  });
}
