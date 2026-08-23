// Async interface allows drop-in Redis replacement in Phase 2
// without touching any caller code.
export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  /**
   * Drop every key under a prefix.
   *
   * Needed because a key can name a *window* rather than a single fact — match ids are cached per
   * (start, count), so one account has several entries and invalidation cannot know which (LA-69).
   */
  delByPrefix(prefix: string): Promise<void>;
}

type CacheEntry = { value: string; expiresAt: number };

/**
 * Bounded, in-process, least-recently-used.
 *
 * The bound is the point. Expiry here is lazy — an entry is only checked when somebody asks for
 * that key — so an entry written and never read again was retained for the life of the process.
 * That is fine for a request-scoped runtime and wrong for Fluid Compute, where instances are
 * deliberately long-lived and reused across many requests: every distinct puuid that ever synced
 * left summoner, match-id and mastery entries behind (a mastery response is ~170 champions), and
 * nothing ever removed them.
 *
 * A Map iterates in insertion order, so the oldest key is the first one `keys()` yields. Re-setting
 * a key deletes and reinserts it, which moves it to the back; a hit does the same. That is enough
 * to make eviction least-recently-*used* rather than merely oldest-written, without a second data
 * structure to keep in step.
 */
const MAX_ENTRIES = 500;

class MemoryCacheStore implements CacheStore {
  private readonly store = new Map<string, CacheEntry>();

  constructor(private readonly maxEntries: number = MAX_ENTRIES) {}

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // Touch: move to the back so eviction sheds what nobody is reading.
    this.store.delete(key);
    this.store.set(key, entry);
    return JSON.parse(entry.value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // Delete first so a re-set moves the key to the back rather than updating it in place.
    this.store.delete(key);
    this.store.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    this.evictIfNeeded();
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /** Test seam: the singleton lives for the process, so a suite needs a way to see the size. */
  get size(): number {
    return this.store.size;
  }

  private evictIfNeeded(): void {
    if (this.store.size <= this.maxEntries) return;

    // Expired entries first — they are free to drop and nobody will miss them. Only if that is not
    // enough does anything live get evicted.
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (this.store.size <= this.maxEntries) return;
      if (now > entry.expiresAt) this.store.delete(key);
    }

    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next();
      if (oldest.done) return;
      this.store.delete(oldest.value);
    }
  }
}

// Process-lifetime singleton — shared across all Riot API calls
export const riotCache: CacheStore = new MemoryCacheStore();

/** Exported for tests, which need to construct one with a small bound. */
export { MemoryCacheStore };
