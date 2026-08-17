// Which champion is today's answer, decided arithmetically rather than by a job.
//
// The obvious alternative — a nightly cron that writes a row per mode — was
// rejected: it cannot serve an anonymous visitor, it leaves the day blank if the
// job fails, and it is awkward to test. Deriving the answer from the date makes
// the whole thing a pure function: no writes, no schedule, and a test can fast
// forward a year in a loop.

/** Day 0. Moving this renumbers every puzzle, so it never moves. */
const EPOCH_MS = Date.UTC(2024, 0, 1);
const MS_PER_DAY = 86_400_000;

/** UTC calendar day as "YYYY-MM-DD". The reset is 00:00 UTC for everyone. */
export function utcDateKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Whole UTC days since the epoch. Negative before 2024-01-01. */
export function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - EPOCH_MS) / MS_PER_DAY);
}

/** Puzzle #1 was 2024-01-01. Shown to players and printed on the share grid. */
export function puzzleNumber(dateKey: string): number {
  return dayNumber(dateKey) + 1;
}

/** The next 00:00 UTC — drives the countdown and the asset cache lifetime. */
export function nextResetAt(now: Date): Date {
  return new Date((Math.floor(now.getTime() / MS_PER_DAY) + 1) * MS_PER_DAY);
}

export function secondsUntilReset(now: Date): number {
  return Math.ceil((nextResetAt(now).getTime() - now.getTime()) / 1000);
}

/** FNV-1a. Small, fast, and stable across runtimes — which matters, because a
 *  different hash on the server than in a test means a different answer. */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — seeded PRNG, so a given seed always deals the same deck. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates against a seeded PRNG. Does not mutate the input. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The deck for one cycle.
 *
 * Reshuffling at every cycle boundary would let the last champion of one deck be
 * the first of the next, so the same answer could land two days running — the one
 * repeat a player is certain to notice. When that happens the first two cards are
 * swapped. The swap only ever touches positions 0 and 1, so it cannot change a
 * deck's *last* card, which is what makes checking the previous cycle safe to do
 * against its unswapped shuffle instead of recursing back to the epoch.
 */
function dealCycle<T>(pool: readonly T[], mode: string, cycle: number): T[] {
  const deck = seededShuffle(pool, fnv1a(`${mode}:${cycle}`));
  if (pool.length < 2) return deck;
  const previous = seededShuffle(pool, fnv1a(`${mode}:${cycle - 1}`));
  if (deck[0] === previous[previous.length - 1]) [deck[0], deck[1]] = [deck[1], deck[0]];
  return deck;
}

/**
 * Deals from a shuffled deck rather than picking an index at random, so a
 * champion cannot reappear until the whole roster has been used. The deck is
 * reshuffled each time it runs out, and seeded per mode, so Splash and Lore are
 * not asking about the same champion on the same day.
 */
export function pickDaily<T>(pool: readonly T[], mode: string, dateKey: string): T {
  if (pool.length === 0) throw new Error(`pickDaily: empty pool for mode "${mode}"`);
  const day = dayNumber(dateKey);
  // Floor-mod keeps dates before the epoch on a positive index.
  const offset = ((day % pool.length) + pool.length) % pool.length;
  const cycle = Math.floor(day / pool.length);
  return dealCycle(pool, mode, cycle)[offset];
}
