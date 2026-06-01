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

// Wraps any async function with retry logic.
// The function must throw an object with a `status` number property on retryable errors.
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

      const status = (err as { status?: number }).status;
      const retryAfterMs = (err as { retryAfterMs?: number }).retryAfterMs;

      // Non-retryable errors propagate immediately
      if (!status || !RETRYABLE_STATUSES.has(status)) {
        throw err;
      }

      // Last attempt — no more retries
      if (attempt === maxAttempts) break;

      // Wait time: Retry-After header takes priority; else exponential backoff + jitter
      const exponential = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * baseDelayMs * 0.5;
      const delay = retryAfterMs ?? Math.min(exponential + jitter, maxDelayMs);

      await sleep(delay);
    }
  }

  throw lastError;
}
