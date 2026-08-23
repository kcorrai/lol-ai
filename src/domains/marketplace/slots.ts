import { merge, subtractAll } from "@/domains/marketplace/intervals";
import type { Interval } from "@/domains/marketplace/intervals";
import {
  dateKey,
  existsInZone,
  instantFromWallTime,
  localDatesBetween,
  type WallTime,
} from "@/domains/marketplace/timezone";

// Availability → bookable slots. Pure: no database, no clock of its own.
//
// The shape follows what Cal.com settled on, because it is the shape the
// problem has: expand the weekly rules into windows for each local day, apply
// that day's exception if there is one, subtract what is already booked, then
// step through what is left.

/** A recurring weekly window, in the coach's own wall-clock minutes. */
export interface WeeklyRule {
  /** 0 = Sunday … 6 = Saturday. */
  days: number[];
  startMinute: number;
  endMinute: number;
}

/** One local date that does not follow the weekly rules. */
export interface DateException {
  /** `YYYY-MM-DD` in the coach's zone. */
  date: string;
  isBlocked: boolean;
  startMinute?: number | null;
  endMinute?: number | null;
}

export interface SlotRequest {
  rules: WeeklyRule[];
  exceptions: DateException[];
  /** Already-taken time, as instants. Bookings, and anything else that blocks. */
  busy: Interval[];
  /** IANA zone the rules are written in. */
  timeZone: string;
  from: Date;
  to: Date;
  durationMinutes: number;
  /** How far apart slot starts are offered. */
  slotIntervalMinutes?: number;
  /** How soon from `now` a slot may start. */
  minimumNoticeMinutes?: number;
  now: Date;
}

const DEFAULT_INTERVAL = 30;
const DEFAULT_NOTICE = 120;

/** Free, bookable start times, in order. */
export function computeFreeSlots(request: SlotRequest): Interval[] {
  const {
    rules,
    exceptions,
    busy,
    timeZone,
    from,
    to,
    durationMinutes,
    slotIntervalMinutes = DEFAULT_INTERVAL,
    minimumNoticeMinutes = DEFAULT_NOTICE,
    now,
  } = request;

  if (durationMinutes <= 0) return [];

  const open = openWindows({ rules, exceptions, timeZone, from, to });
  const free = subtractAll(open, busy);

  const earliest = now.getTime() + minimumNoticeMinutes * 60_000;
  const durationMs = durationMinutes * 60_000;
  const stepMs = slotIntervalMinutes * 60_000;

  const slots: Interval[] = [];

  for (const window of free) {
    // Steps are aligned to the window's own start rather than to the hour, so a
    // coach whose day begins at 18:15 is offered 18:15 and not 18:30.
    for (
      let start = window.start.getTime();
      start + durationMs <= window.end.getTime();
      start += stepMs
    ) {
      if (start < earliest) continue;
      if (start < from.getTime() || start + durationMs > to.getTime()) continue;
      slots.push({ start: new Date(start), end: new Date(start + durationMs) });
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * The coach's open windows as instants, day by day.
 *
 * The offset is resolved for each local date separately — that is the whole
 * point of doing it here rather than once. A window whose start falls in a
 * spring-forward gap is dropped: the clock never showed that time, so nobody
 * could have turned up for it.
 */
export function openWindows(input: {
  rules: WeeklyRule[];
  exceptions: DateException[];
  timeZone: string;
  from: Date;
  to: Date;
}): Interval[] {
  const { rules, exceptions, timeZone, from, to } = input;
  const byDate = new Map(exceptions.map((e) => [e.date, e]));
  const windows: Interval[] = [];

  for (const day of localDatesBetween(from, to, timeZone)) {
    const key = dateKey(day);
    const exception = byDate.get(key);

    if (exception?.isBlocked && exception.startMinute === null) continue;
    if (exception?.isBlocked && exception.startMinute === undefined) continue;

    const ranges = exception ? overrideRanges(exception) : rulesForWeekday(rules, weekdayOf(day));

    for (const range of ranges) {
      if (range.endMinute <= range.startMinute) continue;

      const startWall = withMinutes(day, range.startMinute);
      const endWall = withMinutes(day, range.endMinute);
      if (!existsInZone(startWall, timeZone)) continue;

      windows.push({
        start: instantFromWallTime(startWall, timeZone),
        end: instantFromWallTime(endWall, timeZone),
      });
    }
  }

  return merge(windows);
}

function overrideRanges(exception: DateException): { startMinute: number; endMinute: number }[] {
  if (exception.startMinute == null || exception.endMinute == null) return [];
  return [{ startMinute: exception.startMinute, endMinute: exception.endMinute }];
}

function rulesForWeekday(rules: WeeklyRule[], weekday: number) {
  return rules
    .filter((rule) => rule.days.includes(weekday))
    .map((rule) => ({ startMinute: rule.startMinute, endMinute: rule.endMinute }));
}

function weekdayOf(day: WallTime): number {
  return new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay();
}

function withMinutes(day: WallTime, minute: number): WallTime {
  return {
    year: day.year,
    month: day.month,
    day: day.day,
    hour: Math.floor(minute / 60),
    minute: minute % 60,
  };
}
