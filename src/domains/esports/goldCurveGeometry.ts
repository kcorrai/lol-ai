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

/** How far into the game the curve runs, in seconds — never zero. */
export function curveSpan(timeline: GameTimeline): number {
  return Math.max(...timeline.samples.map((sample) => sample.seconds), 1);
}

export function plotGoldCurve(
  timeline: GameTimeline,
  box: CurveBox
): { points: CurvePoint[]; scale: number; span: number } {
  const span = curveSpan(timeline);
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
  /** 0 nearest the chart; each further objective in the same sample stacks outwards. */
  stack: number;
  seconds: number;
  side: "blue" | "red";
  kind: ObjectiveKind;
  count: number;
}

/** Half a marker's width: how far a marker's centre is kept from the chart's edges. */
export const MARKER_INSET = 9;

/** Stacks closer together than this would touch, so they become one stack. */
export const MIN_STACK_GAP = 20;

/**
 * One marker per objective event, at the x of the sample it was first seen in.
 *
 * Objectives cluster late in a game — a single sample can hold towers, an
 * inhibitor and a baron — so markers sharing a side and a sample stack away
 * from the chart instead of sitting side by side. Spreading them sideways was
 * tried and ran into the next sample, and pushing that one along put it
 * minutes away from when it happened; a stack keeps every marker on its time.
 *
 * The one exception is the game's closing frame, which can land under a
 * minute after the sample before it: a stack that would touch the previous
 * one on its side joins it, and each marker's title still carries its own time.
 */
export function objectiveMarkers(
  timeline: GameTimeline,
  span: number,
  box: CurveBox
): ObjectiveMarker[] {
  const open: Record<"blue" | "red", { x: number; seconds: number; size: number } | null> = {
    blue: null,
    red: null,
  };

  return objectiveEvents(timeline).map((event) => {
    const x = Math.min(
      box.right - MARKER_INSET,
      Math.max(box.left + MARKER_INSET, timeToX(event.seconds, span, box))
    );

    const previous = open[event.side];
    const joins =
      previous !== null && (previous.seconds === event.seconds || x - previous.x < MIN_STACK_GAP);
    const stack = joins && previous ? previous : { x, seconds: event.seconds, size: 0 };
    open[event.side] = stack;
    stack.size += 1;

    return {
      key: `${event.side}:${event.seconds}:${event.kind}`,
      x: stack.x,
      stack: stack.size - 1,
      seconds: event.seconds,
      side: event.side,
      kind: event.kind,
      count: event.count,
    };
  });
}

/** How many markers the tallest stack on a side holds — 0 when it took nothing. */
export function stackDepth(markers: ObjectiveMarker[], side: "blue" | "red"): number {
  return markers
    .filter((marker) => marker.side === side)
    .reduce((depth, marker) => Math.max(depth, marker.stack + 1), 0);
}
