export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// HTTP status codes that are transient and worth retrying
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10_000,
};

/**
 * The status a thrown error is carrying, under either of the two names it can have.
 *
 * `ApiError` — what `normalizeRiotError` produces for every Riot failure — names the field
 * `statusCode`. This function used to read only `status`, which no Riot error has ever had, so
 * every 429 and 503 fell straight through the "non-retryable errors propagate immediately" branch
 * and the retry layer did nothing at all. `status` is still accepted because a raw fetch/undici
 * error uses that name.
 */
function statusOf(err: unknown): number | undefined {
  const e = err as { statusCode?: number; status?: number };
  return e.statusCode ?? e.status;
}

/** A timeout or an aborted request — no status, but as transient as a 503. */
function isAbort(err: unknown): boolean {
  return (
    (err as { name?: string })?.name === "AbortError" ||
    (err as { name?: string })?.name === "TimeoutError"
  );
}

// Wraps any async function with retry logic.
// Retries transient HTTP statuses and aborted/timed-out requests; anything else propagates.
// Riot API 429 responses include a `Retry-After` header; the caller can embed it as
// `retryAfterMs` in the thrown error for precise backoff.
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const status = statusOf(err);
      const retryAfterMs = (err as { retryAfterMs?: number }).retryAfterMs;

      // Non-retryable errors propagate immediately
      if (!isAbort(err) && (!status || !RETRYABLE_STATUSES.has(status))) {
        throw err;
      }

      // Last attempt — no more retries
      if (attempt === maxAttempts) break;

      // Wait time: Retry-After header takes priority; else exponential backoff.
      //
      // Both branches are jittered. Riot hands the same Retry-After to every caller it rate
      // limits, so honouring it exactly wakes all of them in the same millisecond and rebuilds
      // the burst that caused the 429 in the first place.
      const exponential = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * baseDelayMs * 0.5;
      const delay =
        retryAfterMs !== undefined
          ? retryAfterMs + Math.random() * 500
          : Math.min(exponential + jitter, maxDelayMs);

      await sleep(delay);
    }
  }

  throw lastError;
}
