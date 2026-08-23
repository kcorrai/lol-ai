/**
 * Presentation helpers for the public profile's match rows.
 *
 * `formatDuration` deliberately repeats the four lines in `@/domains/esports/duration` rather
 * than importing them: the only sanctioned way in is the esports barrel (CLAUDE.md §4), and that
 * pulls the whole domain — Prisma included — into what is a client bundle on a page anonymous
 * visitors land on. The shared home for this is `src/lib`, which is a move worth its own task.
 */

/** "34:41" — the form a game length is read in, minutes uncapped. */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "3h ago" — how every stats site stamps a match row.
 *
 * Takes `now` so the caller can keep it stable across a list; passing the clock in also keeps
 * this testable without faking timers. Anything in the future (a clock skew between us and Riot)
 * reads as "just now" rather than a negative age.
 */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const elapsed = now - then;
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  const days = Math.floor(elapsed / DAY);
  return days < 30 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
}

/** KDA as every LoL site prints it, with deaths floored so a deathless game is a number. */
export function kdaRatioLabel(kills: number, deaths: number, assists: number): string {
  if (deaths === 0) return "Perfect";
  return ((kills + assists) / deaths).toFixed(2);
}
