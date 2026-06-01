// Token bucket algorithm.
// Limits burst size and average throughput independently.
// Configurable via env vars so production key limits are tunable without code changes.

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TokenBucket {
  private tokens: number;
  private lastRefillAt: number;

  constructor(
    // Max tokens in the bucket (controls burst size)
    private readonly capacity: number,
    // Tokens added per millisecond (controls sustained rate)
    private readonly refillRatePerMs: number
  ) {
    this.tokens = capacity;
    this.lastRefillAt = Date.now();
  }

  // Consume one token, waiting if the bucket is empty.
  async consume(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // How many ms until the next token is available
    const waitMs = Math.ceil((1 - this.tokens) / this.refillRatePerMs);
    await sleep(waitMs);
    this.tokens = 0;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillAt;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRatePerMs);
    this.lastRefillAt = now;
  }
}

// Singleton rate limiter — shared across all Riot API calls in this process.
// Defaults: 20 req/s with burst of 20 (matches Riot development key).
// Override via env vars for production keys.
const perSecond = Number(process.env.RIOT_RATE_LIMIT_PER_SECOND ?? 20);
const burst = Number(process.env.RIOT_RATE_LIMIT_BURST ?? 20);

export const riotRateLimiter = new TokenBucket(
  burst,
  perSecond / 1000 // convert req/sec → req/ms
);
