// The two time windows every widget is computed inside.
//
// Pure — no Prisma, no clock of its own. `now` is always passed in, which is what
// makes the delay behaviour testable at all.

export interface SessionWindowInput {
  /** Explicit session start, from a creator who pressed "reset". Null means today. */
  sessionStartedAt: Date | null;
  /** IANA zone from the creator's Profile. Anything unrecognised falls back to UTC. */
  timezone: string;
  /** The streamer's broadcast delay. */
  delaySeconds: number;
  now: Date;
}

export interface SessionWindow {
  /** Nothing before this counts toward the session. */
  start: Date;
  /**
   * Nothing at or after this may be shown — `now - delaySeconds`.
   *
   * This is the whole point of the delay: a viewer watching a stream that is 90
   * seconds behind must not see the overlay announce a result the broadcast has
   * not reached, because that tells a stream sniper the game just ended.
   */
  visibleUntil: Date;
}

const MAX_DELAY_SECONDS = 900; // 15 minutes — well past any real broadcast delay

/**
 * Midnight at the start of `now`'s day in `timeZone`.
 *
 * Computed by subtracting the wall-clock time already elapsed today rather than
 * by constructing a date, because constructing one needs the zone's UTC offset
 * and `Intl` will not hand it over directly.
 *
 * On the two days a year a zone shifts for DST this lands an hour either side of
 * true local midnight, since wall-clock elapsed and real elapsed disagree across
 * the transition. Correcting it needs a full timezone database; an hour of slop
 * on the boundary of a "games played today" counter is not worth that dependency.
 */
export function startOfLocalDay(now: Date, timeZone: string): Date {
  let hour = 0;
  let minute = 0;
  let second = 0;

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(now);

    for (const part of parts) {
      // `hour12: false` renders midnight as "24" in some ICU builds, so it is
      // taken modulo 24 rather than trusted.
      if (part.type === "hour") hour = Number(part.value) % 24;
      if (part.type === "minute") minute = Number(part.value);
      if (part.type === "second") second = Number(part.value);
    }
  } catch {
    // An unknown zone throws a RangeError. UTC is the safe reading of "today".
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  const elapsedMs = (hour * 3600 + minute * 60 + second) * 1000 + now.getMilliseconds();
  return new Date(now.getTime() - elapsedMs);
}

/** Clamp a stored delay to something sane before it reaches any arithmetic. */
export function normaliseDelaySeconds(delaySeconds: number): number {
  if (!Number.isFinite(delaySeconds)) return 0;
  return Math.min(MAX_DELAY_SECONDS, Math.max(0, Math.trunc(delaySeconds)));
}

export function resolveSessionWindow(input: SessionWindowInput): SessionWindow {
  const delayMs = normaliseDelaySeconds(input.delaySeconds) * 1000;
  const visibleUntil = new Date(input.now.getTime() - delayMs);

  const rawStart = input.sessionStartedAt ?? startOfLocalDay(input.now, input.timezone);

  // A session reset inside the delay window would otherwise produce a backwards
  // range, and every "since the session started" figure would read as though
  // nothing had happened yet — which is true, but the window must still be
  // ordered for the queries built from it.
  const start = rawStart.getTime() > visibleUntil.getTime() ? visibleUntil : rawStart;

  return { start, visibleUntil };
}

/** Whether an event is old enough to be shown under the current delay. */
export function isVisible(at: Date, window: SessionWindow): boolean {
  return at.getTime() <= window.visibleUntil.getTime();
}

/** Whether an event falls inside the session and is old enough to show. */
export function isInSession(at: Date, window: SessionWindow): boolean {
  return at.getTime() >= window.start.getTime() && isVisible(at, window);
}

export { MAX_DELAY_SECONDS };
