/**
 * Runs `worker` over `items` with at most `limit` of them in flight, keeping input order in the
 * result regardless of what finishes first.
 *
 * Bounded rather than `Promise.all`, because the work this exists for shares one fixed budget: the
 * Riot rate limiter is per-process and every caller draws on it. An unbounded fan-out spends the
 * whole allowance at once, the limiter starts inserting sleeps, and everything slows down together
 * — which is what the per-match rank enrichment used to do.
 *
 * If a worker rejects, the pool stops handing out new items, lets the ones already running finish,
 * and then rethrows the first error. Nothing is left running in the background after this settles,
 * which a bare `Promise.all` over a set of started promises cannot promise.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  if (limit < 1) throw new RangeError(`concurrency limit must be at least 1, got ${limit}`);

  const results = new Array<R>(items.length);
  let cursor = 0;
  let firstError: unknown;
  let failed = false;

  async function runner(): Promise<void> {
    while (cursor < items.length && !failed) {
      const index = cursor++;
      try {
        results[index] = await worker(items[index], index);
      } catch (err) {
        // Recorded rather than thrown: throwing here would reject this runner while the others
        // carried on unobserved.
        if (!failed) {
          failed = true;
          firstError = err;
        }
      }
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, runner);
  await Promise.all(runners);

  if (failed) throw firstError;
  return results;
}
