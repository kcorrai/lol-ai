import { prisma } from "@/lib/db/prisma";
import { isValidTimeZone } from "@/domains/marketplace/timezone";
import type { DateException, WeeklyRule } from "@/domains/marketplace/slots";

// Reading and writing a coach's hours.
//
// The database columns are `time` and `date` with no zone, because a weekly
// rule is wall-clock time in the coach's own zone and resolving it to an
// instant is a read-time job (ADR-022). Prisma hands those back as `Date`
// objects anchored to 1970-01-01 UTC, so the conversion to and from minutes
// lives here and nowhere else.

export interface RuleInput {
  days: number[];
  startMinute: number;
  endMinute: number;
}

export interface ExceptionInput {
  /** `YYYY-MM-DD` in the coach's own zone. */
  date: string;
  isBlocked: boolean;
  startMinute?: number | null;
  endMinute?: number | null;
}

export interface AvailabilityView {
  timeZone: string;
  rules: (WeeklyRule & { id: string })[];
  exceptions: (DateException & { id: string; note: string | null })[];
}

const DAY_MINUTES = 24 * 60;

/** A `@db.Time` value as minutes since midnight. */
export function timeToMinutes(value: Date): number {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

/** Minutes since midnight as a `@db.Time` value. */
export function minutesToTime(minute: number): Date {
  return new Date(Date.UTC(1970, 0, 1, Math.floor(minute / 60), minute % 60));
}

/** A `@db.Date` value as the `YYYY-MM-DD` key an exception is looked up by. */
export function dateToKey(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
}

/** A `YYYY-MM-DD` key as a `@db.Date` value. */
export function keyToDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

/** Everything a coach's availability editor needs. */
export async function getAvailability(coachProfileId: string): Promise<AvailabilityView> {
  const [profile, rules, exceptions] = await Promise.all([
    prisma.coachProfile.findUnique({
      where: { id: coachProfileId },
      select: { timezone: true },
    }),
    prisma.coachAvailability.findMany({
      where: { coachProfileId, isActive: true },
      orderBy: { startTime: "asc" },
      select: { id: true, days: true, startTime: true, endTime: true },
    }),
    prisma.coachAvailabilityException.findMany({
      where: { coachProfileId, date: { gte: startOfToday() } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        isBlocked: true,
        overrideStartTime: true,
        overrideEndTime: true,
        note: true,
      },
    }),
  ]);

  return {
    timeZone: profile?.timezone ?? "UTC",
    rules: rules.map((rule) => ({
      id: rule.id,
      days: rule.days,
      startMinute: timeToMinutes(rule.startTime),
      endMinute: timeToMinutes(rule.endTime),
    })),
    exceptions: exceptions.map((exception) => ({
      id: exception.id,
      date: dateToKey(exception.date),
      isBlocked: exception.isBlocked,
      startMinute: exception.overrideStartTime ? timeToMinutes(exception.overrideStartTime) : null,
      endMinute: exception.overrideEndTime ? timeToMinutes(exception.overrideEndTime) : null,
      note: exception.note,
    })),
  };
}

export type AvailabilityOutcome = { ok: true } | { ok: false; detail: string };

/**
 * Replace the whole weekly schedule in one transaction.
 *
 * Replaced rather than patched: a schedule is read as a set, and applying a
 * partial update leaves a window nobody meant to keep. Doing it in one
 * transaction means a failed save cannot leave a coach with no hours at all.
 */
export async function replaceRules(
  coachProfileId: string,
  rules: RuleInput[]
): Promise<AvailabilityOutcome> {
  const invalid = firstInvalidRule(rules);
  if (invalid) return { ok: false, detail: invalid };

  await prisma.$transaction([
    prisma.coachAvailability.deleteMany({ where: { coachProfileId } }),
    prisma.coachAvailability.createMany({
      data: rules.map((rule) => ({
        coachProfileId,
        days: [...new Set(rule.days)].sort(),
        startTime: minutesToTime(rule.startMinute),
        endTime: minutesToTime(rule.endMinute),
      })),
    }),
  ]);

  return { ok: true };
}

/** Add or replace one date's exception. Keyed by date, so saving twice is not two rows. */
export async function upsertException(
  coachProfileId: string,
  input: ExceptionInput
): Promise<AvailabilityOutcome> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, detail: "Invalid date." };

  if (!input.isBlocked) {
    if (input.startMinute == null || input.endMinute == null) {
      return { ok: false, detail: "An open day needs an opening and a closing time." };
    }
    if (input.endMinute <= input.startMinute) {
      return { ok: false, detail: "The closing time has to be after the opening one." };
    }
  }

  const data = {
    isBlocked: input.isBlocked,
    overrideStartTime: input.startMinute == null ? null : minutesToTime(input.startMinute),
    overrideEndTime: input.endMinute == null ? null : minutesToTime(input.endMinute),
  };

  await prisma.coachAvailabilityException.upsert({
    where: { coachProfileId_date: { coachProfileId, date: keyToDate(input.date) } },
    create: { coachProfileId, date: keyToDate(input.date), ...data },
    update: data,
  });

  return { ok: true };
}

/** Remove an exception, putting the day back on the weekly rules. */
export async function deleteException(coachProfileId: string, date: string): Promise<boolean> {
  const { count } = await prisma.coachAvailabilityException.deleteMany({
    where: { coachProfileId, date: keyToDate(date) },
  });
  return count > 0;
}

/** The first thing wrong with a schedule, phrased for the coach. Null when it is fine. */
function firstInvalidRule(rules: RuleInput[]): string | null {
  for (const rule of rules) {
    if (rule.days.length === 0) return "Every row needs at least one day.";
    if (rule.days.some((day) => day < 0 || day > 6)) return "That is not a day of the week.";
    if (rule.startMinute < 0 || rule.endMinute > DAY_MINUTES) {
      return "Hours have to fall inside a single day.";
    }
    if (rule.endMinute <= rule.startMinute) {
      // A window crossing midnight would have to be split into two rows, which
      // the editor does; accepting it here would silently produce no hours.
      return "The finish time has to be after the start time.";
    }
  }
  return null;
}

/** Midnight UTC today — exceptions before it are history and not worth loading. */
function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Whether a zone string is one we can actually resolve hours in. */
export function isSchedulableTimeZone(timeZone: string): boolean {
  return isValidTimeZone(timeZone);
}
