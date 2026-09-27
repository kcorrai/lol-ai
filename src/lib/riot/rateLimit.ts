import { normalizeRiotError } from "@/lib/riot/errors";
import { currentPriority, type RiotPriority } from "@/lib/riot/priority";
import {
  configuredWindows,
  parseRateLimitHeader,
  type RateWindow,
} from "@/lib/riot/rateLimitPolicy";
import {
  createUpstashWindowStore,
  FallbackWindowStore,
  MemoryWindowStore,
  type WindowStore,
} from "@/lib/riot/rateLimitStores";

// The gate every Riot request passes before it leaves (ADR-056).
//
// Riot counts an application's requests per region across every window at once, and blacklists a
// key that keeps going over — first for a while, then for longer. So this counts in a place every
// instance shares, honours every window, and when Riot does answer 429 it stops every instance for
// that region, not only the one that was told.

/**
 * The longest a request will queue for room before giving up.
 *
 * A person is waiting on most of these. Once a two-minute window is spent the honest answer is
 * "Riot is busy, try shortly" — which the pages already know how to say — not a spinner that runs
 * until the platform kills the function. Background jobs fail the same way and are retried by
 * Inngest later.
 */
const MAX_WAIT_MS = 5_000;

/**
 * How much of each window background work may fill, and how long it may queue (ADR-062).
 *
 * Background work counts in the same windows as everyone else but stops at half of each, so the
 * other half is always there for a person. It can afford to wait longer for room: nobody is
 * watching it, and an Inngest step has minutes, not seconds.
 */
const PRIORITY: Record<RiotPriority, { share: number; maxWaitMs: number | null }> = {
  foreground: { share: 1, maxWaitMs: null },
  background: { share: 0.5, maxWaitMs: 60_000 },
};

export interface RiotLimiterOptions {
  store?: WindowStore;
  windows?: RateWindow[];
  maxWaitMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class RiotRateLimiter {
  private readonly store: WindowStore;
  private readonly configured: RateWindow[];
  // What Riot last said each scope's limits are. It outranks config: the header is the truth about
  // the key actually in use, so a production key starts being used at its real size on its first
  // response, with nothing to redeploy.
  private readonly learned = new Map<string, RateWindow[]>();
  private readonly maxWaitMs: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(options: RiotLimiterOptions = {}) {
    this.store = options.store ?? new MemoryWindowStore();
    this.configured = options.windows ?? configuredWindows();
    this.maxWaitMs = options.maxWaitMs ?? MAX_WAIT_MS;
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
  }

  /** Wait for room in `scope`, or throw a 429 if there will be none soon enough. */
  async acquire(scope: string, priority: RiotPriority = currentPriority()): Promise<void> {
    const { share, maxWaitMs } = PRIORITY[priority];
    const deadline = this.now() + (maxWaitMs ?? this.maxWaitMs);
    const windows = this.windowsFor(scope).map((w) => ({
      ...w,
      limit: Math.max(1, Math.floor(w.limit * share)),
    }));

    for (;;) {
      const wait = await this.store.take(scope, windows, this.now());
      if (wait === 0) return;

      if (this.now() + wait > deadline) {
        throw normalizeRiotError(429, Math.ceil(wait / 1000));
      }
      // Jittered, so callers released by the same window do not all arrive in the same instant.
      await this.sleep(wait + Math.random() * 100);
    }
  }

  /** Record the limits Riot reported for this scope (`X-App-Rate-Limit`). */
  learn(scope: string, header: string | null): void {
    const windows = parseRateLimitHeader(header);
    if (windows.length > 0) this.learned.set(scope, windows);
  }

  /** Riot answered 429 for the whole application: nobody sends to this scope until it says. */
  async pause(scope: string, retryAfterMs: number): Promise<void> {
    await this.store.pause(scope, retryAfterMs, this.now());
  }

  private windowsFor(scope: string): RateWindow[] {
    return this.learned.get(scope) ?? this.configured;
  }
}

async function createDefaultLimiter(): Promise<RiotRateLimiter> {
  let shared: WindowStore | null = null;
  try {
    shared = await createUpstashWindowStore();
  } catch {
    shared = null;
  }
  return new RiotRateLimiter({ store: new FallbackWindowStore(shared, new MemoryWindowStore()) });
}

let defaultLimiter: Promise<RiotRateLimiter> | null = null;

/** One per process; the count itself lives in Redis when Redis is configured. */
export function getRiotRateLimiter(): Promise<RiotRateLimiter> {
  defaultLimiter ??= createDefaultLimiter();
  return defaultLimiter;
}
