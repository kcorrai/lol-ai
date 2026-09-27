// The numbers a load test run is judged on, kept apart from the script that collects them so they
// can be tested (LA-126).

export interface Sample {
  path: string;
  status: number;
  ms: number;
  /** `x-nextjs-cache` as the server sent it — HIT, STALE, MISS — or null when it sent none. */
  cache: string | null;
}

export interface PathSummary {
  path: string;
  requests: number;
  /** Anything that is not 2xx or 3xx, plus requests that never got an answer (status 0). */
  errors: number;
  p50: number;
  p95: number;
  p99: number;
  /** Share of answers served from the page cache; the whole point of ISR is that this is high. */
  cacheHitRate: number;
}

/** Nearest-rank percentile of already sorted values. */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
}

export function summarize(samples: Sample[]): PathSummary[] {
  const byPath = new Map<string, Sample[]>();
  for (const s of samples) byPath.set(s.path, [...(byPath.get(s.path) ?? []), s]);

  return [...byPath.entries()].map(([path, list]) => {
    const times = list.map((s) => s.ms).sort((a, b) => a - b);
    const hits = list.filter((s) => s.cache === "HIT" || s.cache === "STALE").length;
    return {
      path,
      requests: list.length,
      errors: list.filter((s) => s.status === 0 || s.status >= 400).length,
      p50: percentile(times, 50),
      p95: percentile(times, 95),
      p99: percentile(times, 99),
      cacheHitRate: list.length > 0 ? hits / list.length : 0,
    };
  });
}
