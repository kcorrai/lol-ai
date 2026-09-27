import { goldDiff, objectiveEvents } from "@/domains/esports/timeline";
import type { ObjectiveEvent, ObjectiveKind } from "@/domains/esports/timeline";
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

/** How far apart markers sharing a sample sit, in viewBox units. */
export const MARKER_GAP = 20;

/**
 * One marker per objective event, at the sample it was first seen in.
 *
 * Several objectives often fall inside one four-minute window — a dragon and
 * two towers — so markers sharing a side and a sample are fanned out around
 * that sample's x instead of drawn on top of each other.
 */
export function objectiveMarkers(
  timeline: GameTimeline,
  span: number,
  box: CurveBox
): ObjectiveMarker[] {
  const groups = new Map<string, ObjectiveEvent[]>();
  for (const event of objectiveEvents(timeline)) {
    const key = `${event.side}:${event.seconds}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }

  return [...groups.values()].flatMap((events) => {
    // The group moves inwards as a whole near either edge, so a fan at the
    // final sample stays inside the chart without its markers piling up.
    const half = ((events.length - 1) / 2) * MARKER_GAP;
    const edge = MARKER_GAP / 2 + half;
    const centre = Math.min(
      box.right - edge,
      Math.max(box.left + edge, timeToX(events[0].seconds, span, box))
    );

    return events.map((event, index) => ({
      key: `${event.side}:${event.seconds}:${event.kind}`,
      x: centre - half + index * MARKER_GAP,
      seconds: event.seconds,
      side: event.side,
      kind: event.kind,
      count: event.count,
    }));
  });
}
