// Wall-clock time in an IANA zone ↔ UTC instants, with no dependency.
//
// This exists because a weekly availability rule is wall-clock ("every Tuesday
// 18:00–21:00 in Istanbul") and a booking is an instant. Collapsing the rule to
// one fixed UTC offset is exactly what breaks on the day the clocks move —
// Cal.com's own code carries the comment "there will be 60 min offset on the
// day of DST change" for the same reason. So the offset is resolved per
// calendar day, here, and never cached across one.
//
// `Intl` does the actual zone maths; the browser and Node both ship the IANA
// database, so there is nothing to install and nothing to keep updated.

/** Local wall-clock fields, as a zone would show them. */
export interface WallTime {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number;
  minute: number;
}

const FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let dtf = FORMATTERS.get(timeZone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    FORMATTERS.set(timeZone, dtf);
  }
  return dtf;
}

/** Whether a string is a zone this runtime knows. Anything else is a typo or a lie. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** What the clock reads in `timeZone` at a given instant. */
export function wallTimeIn(instant: Date, timeZone: string): WallTime {
  const parts = formatter(timeZone).formatToParts(instant);
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === 24 ? 0 : get("hour"), // some ICU versions report midnight as 24
    minute: get("minute"),
  };
}

/** The zone's offset from UTC at a given instant, in milliseconds. Positive is east. */
export function offsetMsAt(instant: Date, timeZone: string): number {
  const wall = wallTimeIn(instant, timeZone);
  const asIfUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  // Seconds are dropped on both sides, so compare on the same truncation.
  const truncated = Math.floor(instant.getTime() / 60_000) * 60_000;
  return asIfUtc - truncated;
}

/**
 * The instant at which a zone's clock reads a given wall time.
 *
 * Two passes, and the second is the one that matters. The first guess uses the
 * offset in force at the *wrong* instant — a naive UTC reading of the wall
 * time — which is off by an hour on either side of a DST boundary. Re-reading
 * the offset at the corrected instant fixes it.
 *
 * Two wall times have no single answer and are documented here rather than
 * hidden:
 *
 *  - **Spring forward** skips an hour, so a wall time inside the gap never
 *    happens. This returns the instant the clock jumps to, and `existsInZone`
 *    below reports it as absent so callers can drop the slot instead.
 *  - **Autumn back** repeats an hour. This returns the first occurrence, which
 *    is the earlier instant — the one a person expecting "18:00" would arrive at.
 */
export function instantFromWallTime(wall: WallTime, timeZone: string): Date {
  const naive = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  const HALF_DAY = 43_200_000;

  // Probe the offset on both sides of the boundary as well as at the naive
  // instant. Around a transition these disagree, and each disagreement is a
  // candidate answer; away from one they collapse to the same number.
  const candidates = new Set<number>();
  for (const probe of [naive - HALF_DAY, naive, naive + HALF_DAY]) {
    candidates.add(naive - offsetMsAt(new Date(probe), timeZone));
  }

  const real = [...candidates].filter((instant) => {
    const back = wallTimeIn(new Date(instant), timeZone);
    return back.day === wall.day && back.hour === wall.hour && back.minute === wall.minute;
  });

  // Overlap: the clock shows this time twice and both candidates are real, so
  // take the earlier — the instant a person expecting "01:30" turns up at.
  if (real.length > 0) return new Date(Math.min(...real));

  // Gap: the clock never shows it. Fall back to the two-pass result, which is
  // the instant the clock jumps to; `existsInZone` reports this case so a
  // caller can drop the slot rather than book an hour that did not happen.
  const firstGuess = new Date(naive - offsetMsAt(new Date(naive), timeZone));
  return new Date(naive - offsetMsAt(firstGuess, timeZone));
}

/**
 * Whether a wall time actually occurs in a zone.
 *
 * False only inside a spring-forward gap: converting to an instant and back
 * lands on a different clock reading, because the clock never showed the one
 * asked for.
 */
export function existsInZone(wall: WallTime, timeZone: string): boolean {
  const back = wallTimeIn(instantFromWallTime(wall, timeZone), timeZone);
  return back.hour === wall.hour && back.minute === wall.minute && back.day === wall.day;
}

/** `YYYY-MM-DD` for a wall time — the key an availability exception is stored under. */
export function dateKey(wall: WallTime): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}`;
}

/** Every local calendar date between two instants, inclusive, in the zone's own reckoning. */
export function localDatesBetween(from: Date, to: Date, timeZone: string): WallTime[] {
  const dates: WallTime[] = [];
  const start = wallTimeIn(from, timeZone);

  // Walked as UTC midnights and re-read in the zone each step, so a day is
  // never skipped or repeated around a transition.
  let cursor = Date.UTC(start.year, start.month - 1, start.day);
  const limit = to.getTime();

  for (let guard = 0; guard < 400; guard += 1) {
    const wall = { year: 0, month: 0, day: 0, hour: 0, minute: 0 };
    const asDate = new Date(cursor);
    wall.year = asDate.getUTCFullYear();
    wall.month = asDate.getUTCMonth() + 1;
    wall.day = asDate.getUTCDate();

    // The day is in range while any part of it can still start before `to`.
    if (instantFromWallTime(wall, timeZone).getTime() > limit) break;

    dates.push(wall);
    cursor += 86_400_000;
  }

  return dates;
}
