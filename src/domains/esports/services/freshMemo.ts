// A process-level memo in front of the esports cache, for the few resources
// that nearly every esports page reads.
//
// Measured on 2026-10-03 (LA-136): one `next build` read the 1.3MB team list
// about two thousand times, because every prerendered page asked the cache for
// it on its own — roughly 2.6GB per build, served by Redis while it is warm and
// by Neon the moment it is not. Collapsing those reads to one per process per
// window is what this file does.
//
// The promise is held rather than the value, so pages rendering concurrently on
// a cold memo share one read instead of racing each other to the cache.

const MAX_AGE_MS = 5 * 60 * 1000;
// Teams and leagues hold one entry each and the pro sample one per league, so
// this is room for every league with margin. The cap only guards against a key
// that turns out to vary per request.
const MAX_ENTRIES = 64;

interface Entry {
  value: Promise<unknown>;
  expiresAt: number;
}

const memo = new Map<string, Entry>();

function remember(key: string, value: Promise<unknown>, ttlDays: number): Entry {
  // Never longer than the cache's own fresh window, so the memo cannot keep a
  // value alive past the point the cache would have refetched it.
  const ageMs = Math.min(ttlDays * 86_400_000, MAX_AGE_MS);
  const entry: Entry = { value, expiresAt: Date.now() + ageMs };
  memo.delete(key);
  memo.set(key, entry);
  while (memo.size > MAX_ENTRIES) {
    const oldest = memo.keys().next();
    if (oldest.done) break;
    memo.delete(oldest.value);
  }
  return entry;
}

/**
 * Serve `load` through the memo. A null or a failure is not kept: it means the
 * feed and every cached copy were unavailable, and holding that for minutes
 * would keep pages empty after the feed recovered.
 *
 * `force` (the warm job) always loads, then replaces whatever was memoised.
 */
export async function memoized<TValue>(
  key: string,
  ttlDays: number,
  force: boolean,
  load: () => Promise<TValue | null>
): Promise<TValue | null> {
  const hit = memo.get(key);
  if (!force && hit && hit.expiresAt > Date.now()) return hit.value as Promise<TValue | null>;

  const entry = remember(key, load(), ttlDays);
  try {
    const value = (await entry.value) as TValue | null;
    if (value === null && memo.get(key) === entry) memo.delete(key);
    return value;
  } catch (err) {
    if (memo.get(key) === entry) memo.delete(key);
    throw err;
  }
}

/** Test-only: forget everything, so no test sees a value another one loaded. */
export function __resetFreshMemo(): void {
  memo.clear();
}
