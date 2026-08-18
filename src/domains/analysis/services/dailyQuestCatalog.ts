// The on-site half of the daily quest.
//
// Which task a player gets is derived from their id and the calendar day rather
// than stored, for the same reason the quiz derives its answer instead of
// scheduling one (src/domains/quiz/services/dailySeed.ts): a job that writes a
// row per user per day is a job that can fail, and a day with no quest reads as
// a broken feature. Deriving it makes the whole assignment a pure function, so
// no table, no cron, and a test can walk a year in a loop.
//
// The seed helpers are not reused from the quiz domain on purpose: its public
// index pulls ~460 KB of champion JSON, which has no business being loaded to
// decide which of four sentences to show on the dashboard.

/** Every on-site task must be verifiable from a table the app already writes. */
export type OnSiteTaskId = "quiz" | "academy" | "report" | "card";

export interface OnSiteTask {
  id: OnSiteTaskId;
  /** Imperative, one line — this is what the player reads as the objective. */
  title: string;
  /** Why it is worth doing. Shown small, under the title. */
  hint: string;
  href: string;
  ctaLabel: string;
  xpReward: number;
}

// Ordered, and the order matters: the rotation walks this list, so neighbours
// should not be two heavy asks in a row.
export const ON_SITE_TASKS: readonly OnSiteTask[] = Object.freeze([
  {
    id: "quiz",
    title: "Solve today's champion puzzle",
    hint: "One puzzle, one guess ladder. Keeps your quiz streak alive too.",
    href: "/quiz",
    ctaLabel: "Play the daily",
    xpReward: 20,
  },
  {
    id: "academy",
    title: "Finish an Academy lesson",
    hint: "A single lesson from your track — roughly ten minutes.",
    href: "/academy",
    ctaLabel: "Open Academy",
    xpReward: 30,
  },
  {
    id: "report",
    title: "Pull a fresh coaching report",
    hint: "Have the AI read your last games and name the one habit to fix.",
    href: "/coaching",
    ctaLabel: "Run a report",
    xpReward: 25,
  },
  {
    id: "card",
    title: "Share a progress card",
    hint: "Turn a week of games into a card worth posting.",
    href: "/recap",
    ctaLabel: "Build a card",
    xpReward: 15,
  },
]);

const MS_PER_DAY = 86_400_000;

/** The quest day is the UTC calendar day, matching the quiz reset and the
 *  challenge window — three different resets would be three different "todays". */
export function questDateKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Whole UTC days since the Unix epoch. Only differences matter, so the origin is arbitrary. */
export function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** `dateKey` shifted by whole days. Negative goes back. */
export function shiftDateKey(dateKey: string, days: number): string {
  return new Date((dayNumber(dateKey) + days) * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Midnight UTC that opens the day, and the one that closes it. */
export function dayWindow(dateKey: string): { start: Date; end: Date } {
  const start = new Date(dayNumber(dateKey) * MS_PER_DAY);
  return { start, end: new Date(start.getTime() + MS_PER_DAY) };
}

/** FNV-1a over the user id. Only needed to spread players across start offsets,
 *  so that everyone is not asked for the same thing on the same day. */
function userOffset(userId: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Rotation rather than a per-day random pick: a random pick repeats, and being
 * asked to finish an Academy lesson three days running is how a daily quest
 * starts getting ignored. Walking the list guarantees every task appears once
 * before any repeats.
 */
export function pickOnSiteTask(userId: string, dateKey: string): OnSiteTask {
  const n = ON_SITE_TASKS.length;
  const index = (((dayNumber(dateKey) + userOffset(userId)) % n) + n) % n;
  return ON_SITE_TASKS[index];
}
