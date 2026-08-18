import type { WeeklyRule } from "@/domains/marketplace/slots";

// Turning the weekly rules into a clickable week and back again.
//
// The grid is hourly and the rules are minute-precise, so this is deliberately
// lossy in one direction only: reading rules into the grid rounds outwards so
// no bookable minute is ever hidden, and writing the grid back snaps to the
// hour. `isHourAligned` exists so the page can warn before that happens rather
// than quietly rewriting a coach's 18:30 start.

/** `"<day>:<hour>"`, day 0 = Sunday. */
export type CellKey = string;

export function cellKey(day: number, hour: number): CellKey {
  return `${day}:${hour}`;
}

/** True when every rule starts and ends on the hour, so the grid is faithful. */
export function isHourAligned(rules: WeeklyRule[]): boolean {
  return rules.every((rule) => rule.startMinute % 60 === 0 && rule.endMinute % 60 === 0);
}

/**
 * Every hour any rule makes bookable.
 *
 * Rounded outwards: a rule from 18:30 lights 18:00, because a grid that hid a
 * half-open hour would make a coach think they had closed it.
 */
export function rulesToGrid(rules: WeeklyRule[]): Set<CellKey> {
  const open = new Set<CellKey>();

  for (const rule of rules) {
    const from = Math.floor(rule.startMinute / 60);
    const to = Math.ceil(rule.endMinute / 60);
    for (const day of rule.days) {
      for (let hour = from; hour < to; hour += 1) open.add(cellKey(day, hour));
    }
  }

  return open;
}

/**
 * The fewest rules that describe a grid exactly.
 *
 * Contiguous hours on one day become one span, then days whose spans are
 * identical are merged into a single rule — which is what a coach would have
 * typed by hand, and keeps the stored pattern from growing a row per day.
 */
export function gridToRules(open: Set<CellKey>): WeeklyRule[] {
  const spansByDay = new Map<number, [number, number][]>();

  for (let day = 0; day < 7; day += 1) {
    const hours = [];
    for (let hour = 0; hour < 24; hour += 1) {
      if (open.has(cellKey(day, hour))) hours.push(hour);
    }
    if (hours.length === 0) continue;

    const spans: [number, number][] = [];
    let start = hours[0];
    let previous = hours[0];
    for (const hour of hours.slice(1)) {
      if (hour === previous + 1) {
        previous = hour;
        continue;
      }
      spans.push([start, previous + 1]);
      start = hour;
      previous = hour;
    }
    spans.push([start, previous + 1]);
    spansByDay.set(day, spans);
  }

  // Days with the same shape share a rule. The signature is the span list, so
  // "Mon–Fri 18:00–22:00" stays one row rather than five.
  const byShape = new Map<string, { days: number[]; spans: [number, number][] }>();
  for (const [day, spans] of spansByDay) {
    const shape = JSON.stringify(spans);
    const existing = byShape.get(shape);
    if (existing) existing.days.push(day);
    else byShape.set(shape, { days: [day], spans });
  }

  const rules: WeeklyRule[] = [];
  for (const { days, spans } of byShape.values()) {
    for (const [from, to] of spans) {
      rules.push({ days: [...days].sort((a, b) => a - b), startMinute: from * 60, endMinute: to * 60 });
    }
  }

  return rules.sort((a, b) => a.startMinute - b.startMinute || a.days[0] - b.days[0]);
}

/** Hours a week of rules makes bookable, before exceptions and bookings. */
export function openHoursPerWeek(rules: WeeklyRule[]): number {
  const minutes = rules.reduce(
    (sum, rule) => sum + (rule.endMinute - rule.startMinute) * rule.days.length,
    0
  );
  return Math.round(minutes / 60);
}
