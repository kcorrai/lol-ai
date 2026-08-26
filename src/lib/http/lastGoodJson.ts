import { dedup } from "@/lib/riot/dedup";

interface Entry {
  value: unknown;
  storedAt: number;
}

/**
 * A handful of catalogue URLs, not user-keyed — but bounded anyway, because an
 * unbounded process-lifetime map on Fluid Compute is how the Riot cache grew forever.
 */
const MAX_ENTRIES = 50;

const lastGood = new Map<string, Entry>();

const DEFAULT_TTL_SECONDS = 3600;
const DEFAULT_TIMEOUT_MS = 5000;

export interface LastGoodOptions {
  /** How long a stored answer is served without asking upstream again. */
  ttlSeconds?: number;
  /** How long one attempt may take before it is abandoned. */
  timeoutMs?: number;
  headers?: Record<string, string>;
}

/**
 * Reads JSON from a third-party host in a way that cannot take the page down with it.
 *
 * `fetch(url, { next: { revalidate } })` looked like the safe option and was the whole
 * problem: when the cached entry goes stale Next refreshes it *after* the render, and a
 * refresh that rejects destroys the response being piped — so an unreachable Data Dragon
 * turned a page that had a perfectly good cached catalogue into a 500. A `catch` at the
 * call site cannot help, because the rejection does not happen at the call site. Every
 * caller already had one, and every caller still 500'd.
 *
 * So the framework cache is not used here at all. This owns its own TTL, its own timeout,
 * and keeps the last good answer past expiry: an upstream that is down serves the stale
 * catalogue rather than nothing, which is what ADR-016's degrade-to-last-good actually
 * asked for. It resolves to `undefined` instead of rejecting — there is no failure mode
 * in which a caller has to handle a thrown error.
 *
 * The trade against the framework cache is real and accepted: this map is per-instance
 * and dies with the process, so N instances each pay one request per TTL instead of
 * sharing one. For a catalogue fetched hourly that is cheap; a page that 500s is not.
 */
export async function fetchJsonLastGood<T>(
  url: string,
  options: LastGoodOptions = {}
): Promise<T | undefined> {
  const ttlMs = (options.ttlSeconds ?? DEFAULT_TTL_SECONDS) * 1000;
  const cached = lastGood.get(url);

  if (cached && Date.now() - cached.storedAt < ttlMs) return cached.value as T;

  return dedup(`lastGoodJson:${url}`, async () => {
    try {
      const res = await fetch(url, {
        headers: options.headers,
        // Not `next: { revalidate }` — see above. This is the entire fix.
        //
        // And `no-cache` rather than `no-store`, which reads like the same instruction
        // and is, to the framework's cache: patch-fetch maps both to `revalidate: 0`,
        // so a response is stored under neither. Only `no-store` also throws a
        // DynamicServerError inside a prerender — and this helper reads the Data Dragon
        // catalogues that a dozen ISR tool pages are built from, so under `no-store`
        // every one of those reads failed during `next build` and the caller fell back
        // to a Postgres row. ADR-045.
        cache: "no-cache",
        signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });
      if (!res.ok) return serveStale<T>(url);

      const value = (await res.json()) as T;
      store(url, value);
      return value;
    } catch {
      return serveStale<T>(url);
    }
  });
}

/**
 * Expiry is deliberately ignored here. An entry is only stale because we could not
 * reach the host to replace it, and a patch-old item catalogue reads far better than
 * an empty one.
 */
function serveStale<T>(url: string): T | undefined {
  const entry = lastGood.get(url);
  return entry ? (entry.value as T) : undefined;
}

function store(url: string, value: unknown): void {
  // Re-inserting moves the key to the back, so the first key out is the coldest.
  lastGood.delete(url);
  lastGood.set(url, { value, storedAt: Date.now() });

  while (lastGood.size > MAX_ENTRIES) {
    const oldest = lastGood.keys().next();
    if (oldest.done) return;
    lastGood.delete(oldest.value);
  }
}

/** Test seam: the map lives for the process, so a suite needs to reset it. */
export function __clearLastGoodJson(): void {
  lastGood.clear();
}
