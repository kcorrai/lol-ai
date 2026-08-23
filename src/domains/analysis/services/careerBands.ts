// The calendar the timeline scrolls through, and the rule that decides how much of
// each month a reader actually sees. Pure — no Prisma, no clock.

import type { CareerBand, CareerEvent, CareerMatchRow } from "./careerTimeline.types";
import { EVENTS_PER_BAND } from "./careerTimelineConstants";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-08". UTC, matching every other day boundary in the app. */
export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/** "August 2026" */
export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function groupByMonth(rows: readonly CareerMatchRow[]): Map<string, CareerMatchRow[]> {
  const byMonth = new Map<string, CareerMatchRow[]>();
  for (const row of rows) {
    const key = monthKey(row.gameStart);
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(row);
    else byMonth.set(key, [row]);
  }
  return byMonth;
}

function emptyBand(key: string): CareerBand {
  return {
    key,
    label: monthLabel(key),
    games: 0,
    wins: 0,
    winRate: null,
    lpDelta: null,
    rankAtClose: null,
    events: [],
  };
}

/**
 * One band per month that has games, newest first. Events are attached later — a band
 * is the calendar, not the content.
 */
export function buildBands(rows: readonly CareerMatchRow[]): CareerBand[] {
  return [...groupByMonth(rows).entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, monthRows]) => {
      const wins = monthRows.filter((r) => r.won).length;
      return {
        ...emptyBand(key),
        games: monthRows.length,
        wins,
        winRate: Math.round((wins / monthRows.length) * 100),
      };
    });
}

/**
 * Drops events into their month, and cuts each month down to what a person will read.
 *
 * Months with no games still get a band when something happened in them — finishing an
 * Academy track in a month you did not queue is exactly the kind of thing a career
 * timeline should not silently swallow.
 */
export function curateIntoBands(
  bands: readonly CareerBand[],
  events: readonly CareerEvent[],
  cap = EVENTS_PER_BAND
): { bands: CareerBand[]; trimmed: number } {
  const byKey = new Map(bands.map((b) => [b.key, { ...b, events: [] as CareerEvent[] }]));

  for (const event of events) {
    const key = monthKey(new Date(event.at));
    let band = byKey.get(key);
    if (!band) {
      band = emptyBand(key);
      byKey.set(key, band);
    }
    band.events.push(event);
  }

  let trimmed = 0;
  const out = [...byKey.values()]
    .map((band) => {
      // Heaviest first to decide what survives, then back into date order to be read.
      const kept = [...band.events]
        .sort((a, b) => b.weight - a.weight || b.at.localeCompare(a.at))
        .slice(0, cap)
        .sort((a, b) => b.at.localeCompare(a.at));
      trimmed += band.events.length - kept.length;
      return { ...band, events: kept };
    })
    .filter((band) => band.games > 0 || band.events.length > 0)
    .sort((a, b) => b.key.localeCompare(a.key));

  return { bands: out, trimmed };
}
