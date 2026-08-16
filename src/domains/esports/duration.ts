/**
 * Game length, and the per-minute figures that depend on it.
 *
 * ADR-016 and every page built on it recorded game duration as something neither
 * feed publishes, so the section only ever showed per-game totals. It is not
 * published, but it *is* derivable: `window/{gameId}` with no `startingTime`
 * answers with the game's opening frames, and the closing frame is already
 * fetched to build the scoreboard. The difference between the two timestamps is
 * the game.
 *
 * That makes it a measurement rather than a claim, and it is only as good as the
 * frames: a game whose opening frames the feed never published has no duration,
 * and everything here returns null rather than guessing one.
 */

/**
 * Shortest game we will believe.
 *
 * A remake ends around three minutes and a genuine stomp around fifteen, but a
 * feed that publishes one stray frame pair can produce a "game" of seconds.
 * Below this the derivation is more likely broken than the game short.
 */
const MIN_PLAUSIBLE_SECONDS = 120;

/**
 * Longest game we will believe. The record professional game is a little over
 * ninety minutes; two hours leaves room and still catches a clock that ran on
 * after the feed stopped.
 */
const MAX_PLAUSIBLE_SECONDS = 2 * 60 * 60;

/**
 * Seconds between two frame timestamps, or null when the pair cannot be trusted.
 *
 * Both bounds matter. Without the lower one a single duplicated frame reports a
 * four-second game and every per-minute figure derived from it explodes; without
 * the upper one a feed that kept publishing after the nexus fell quietly halves
 * every rate on the page.
 */
export function elapsedSeconds(
  startIso: string | null | undefined,
  endIso: string | null | undefined
): number | null {
  if (!startIso || !endIso) return null;

  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;

  const seconds = (end - start) / 1000;
  if (seconds < MIN_PLAUSIBLE_SECONDS || seconds > MAX_PLAUSIBLE_SECONDS) return null;

  return Math.round(seconds);
}

/**
 * A per-game total expressed per minute, or null when the game has no length.
 *
 * Null is the whole point of the return type: a caller that has no duration must
 * print an em dash, not a rate computed against a made-up game length.
 */
export function perMinute(total: number | null, durationSeconds: number | null): number | null {
  if (total === null || durationSeconds === null || durationSeconds <= 0) return null;
  return (total / durationSeconds) * 60;
}

/** "34:41" — the form a game length is read in, minutes uncapped. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * Mean length of the games that have one, or null when none do.
 *
 * Averaged over the games with a duration rather than over the whole sample:
 * counting a game with no published opening frame as zero would drag every
 * derived rate upward, which is worse than answering over a smaller sample.
 */
export function meanDuration(durations: (number | null)[]): number | null {
  const known = durations.filter((value): value is number => value !== null);
  if (known.length === 0) return null;
  return known.reduce((sum, value) => sum + value, 0) / known.length;
}
