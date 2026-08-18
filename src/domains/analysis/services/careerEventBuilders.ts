// The two kinds of event that have to be *found* in the match rows rather than read
// out of a table: the champion a stretch of a career belonged to, and the games that
// still hold a personal record. Pure — no Prisma, no clock.

import type { CareerEvent, CareerMatchRow } from "./careerTimeline.types";
import { groupByMonth, monthKey } from "./careerBands";
import {
  EVENT_WEIGHT,
  MIN_ERA_GAMES,
  MIN_GAMES_FOR_RECORDS,
  MIN_STREAK,
} from "./careerTimelineConstants";

function kda(row: CareerMatchRow): number {
  return (row.kills + row.assists) / Math.max(row.deaths, 1);
}

function round(value: number, places = 1): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

/** The champion a month belonged to. Ties break on name so the same input always deals the same era. */
function topChampionOfMonth(monthRows: readonly CareerMatchRow[]): string {
  const counts = new Map<string, number>();
  for (const r of monthRows) counts.set(r.championName, (counts.get(r.championName) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

/**
 * A champion era is a run of consecutive months a champion spent as the most-played one.
 *
 * Defined monthly rather than over a rolling window of games on purpose: it is the
 * definition a player can check against their own memory — "that was my Yasuo spring" —
 * and it falls straight out of the bands the page already shows.
 */
export function buildChampionEras(rows: readonly CareerMatchRow[]): CareerEvent[] {
  if (rows.length === 0) return [];

  const byMonth = groupByMonth(rows);
  const months = [...byMonth.keys()].sort();
  const events: CareerEvent[] = [];

  let eraChampion: string | null = null;
  let eraMonths: string[] = [];

  const flush = (): void => {
    if (!eraChampion) return;
    const champion = eraChampion;
    const eraRows = eraMonths
      .flatMap((m) => byMonth.get(m) ?? [])
      .filter((r) => r.championName === champion)
      .sort((a, b) => a.gameStart.getTime() - b.gameStart.getTime());

    if (eraRows.length >= MIN_ERA_GAMES) {
      const wins = eraRows.filter((r) => r.won).length;
      const start = eraRows[0];
      events.push({
        id: `era:${champion}:${monthKey(start.gameStart)}`,
        kind: "champion_era",
        group: "champions",
        at: start.gameStart.toISOString(),
        title: `Your ${champion} era began`,
        detail: `${eraRows.length} games · ${Math.round((wins / eraRows.length) * 100)}% win rate`,
        tone: "neutral",
        weight: EVENT_WEIGHT.champion_era,
        href: null,
      });
    }
    eraChampion = null;
    eraMonths = [];
  };

  for (const month of months) {
    const champion = topChampionOfMonth(byMonth.get(month) ?? []);
    if (champion === eraChampion) {
      eraMonths.push(month);
      continue;
    }
    flush();
    eraChampion = champion;
    eraMonths = [month];
  }
  flush();

  return events;
}

interface RecordSpec {
  key: string;
  label: string;
  value: (row: CareerMatchRow) => number;
  format: (row: CareerMatchRow, value: number) => string;
}

const RECORD_SPECS: readonly RecordSpec[] = [
  {
    key: "kda",
    label: "Your best game",
    value: kda,
    format: (row, value) =>
      `${row.kills}/${row.deaths}/${row.assists} on ${row.championName} · ${round(value)} KDA`,
  },
  {
    key: "kills",
    label: "Most kills in a game",
    value: (row) => row.kills,
    format: (row, value) => `${value} kills on ${row.championName}`,
  },
  {
    key: "cs",
    label: "Best farming game",
    value: (row) => row.csPerMinute,
    format: (row, value) => `${round(value)} CS/min on ${row.championName}`,
  },
  {
    key: "vision",
    label: "Best vision game",
    value: (row) => row.visionScore,
    format: (row, value) => `${value} vision score on ${row.championName}`,
  },
];

/**
 * Personal bests, each pinned to the game that set the record that still stands.
 *
 * Only the standing record is emitted, not every time one was broken — a player's first
 * twenty games break records constantly and the timeline would read as nothing else.
 * Pinning it to the day it was set is what keeps it a moment rather than a statistic.
 */
export function buildRecords(rows: readonly CareerMatchRow[]): CareerEvent[] {
  if (rows.length < MIN_GAMES_FOR_RECORDS) return [];

  const chronological = [...rows].sort((a, b) => a.gameStart.getTime() - b.gameStart.getTime());
  const events: CareerEvent[] = [];

  for (const spec of RECORD_SPECS) {
    let best: { row: CareerMatchRow; value: number } | null = null;
    for (const row of chronological) {
      const value = spec.value(row);
      // Strictly greater, so a tie keeps the earlier game — the one that actually set it.
      if (!best || value > best.value) best = { row, value };
    }
    if (!best || best.value <= 0) continue;

    events.push({
      id: `record:${spec.key}:${best.row.matchId}`,
      kind: "record",
      group: "records",
      at: best.row.gameStart.toISOString(),
      title: spec.label,
      detail: spec.format(best.row, best.value),
      tone: "good",
      weight: EVENT_WEIGHT.record,
      href: `/match/${best.row.matchId}`,
    });
  }

  const streak = longestWinStreak(chronological);
  if (streak) {
    events.push({
      id: `record:streak:${streak.endRow.matchId}`,
      kind: "record",
      group: "records",
      at: streak.endRow.gameStart.toISOString(),
      title: `${streak.length}-game win streak`,
      detail: `Ended on ${streak.endRow.championName}`,
      tone: "good",
      weight: EVENT_WEIGHT.record,
      href: `/match/${streak.endRow.matchId}`,
    });
  }

  return events;
}

/** Pinned to the last win of the run, which is the day it became the record. */
function longestWinStreak(
  chronological: readonly CareerMatchRow[]
): { length: number; endRow: CareerMatchRow } | null {
  let best: { length: number; endRow: CareerMatchRow } | null = null;
  let run = 0;

  for (const row of chronological) {
    if (!row.won) {
      run = 0;
      continue;
    }
    run++;
    if (run >= MIN_STREAK && (!best || run > best.length)) best = { length: run, endRow: row };
  }
  return best;
}
