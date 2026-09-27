import { describe, it, expect, vi } from "vitest";
import { RiotRateLimiter } from "./rateLimit";
import { MemoryWindowStore } from "./rateLimitStores";
import { runAsBackground } from "./priority";

function clock() {
  let now = 0;
  return {
    now: () => now,
    sleep: vi.fn(async (ms: number) => {
      now += ms;
    }),
  };
}

const ONE_PER_SECOND = [{ limit: 1, windowMs: 1_000 }];

describe("RiotRateLimiter", () => {
  it("waits for room when it is coming soon", async () => {
    const c = clock();
    const limiter = new RiotRateLimiter({
      store: new MemoryWindowStore(),
      windows: ONE_PER_SECOND,
      ...c,
    });

    await limiter.acquire("euw1");
    await limiter.acquire("euw1");

    expect(c.sleep).toHaveBeenCalledTimes(1);
    expect(c.now()).toBeGreaterThanOrEqual(1_000);
  });

  it("gives up with a 429 rather than queue past the wait limit", async () => {
    const c = clock();
    const limiter = new RiotRateLimiter({
      store: new MemoryWindowStore(),
      windows: [{ limit: 1, windowMs: 120_000 }],
      maxWaitMs: 5_000,
      ...c,
    });

    await limiter.acquire("euw1");
    await expect(limiter.acquire("euw1")).rejects.toMatchObject({
      code: "RIOT_RATE_LIMITED",
      retryAfterMs: 120_000,
    });
    expect(c.sleep).not.toHaveBeenCalled();
  });

  it("switches to the limits Riot reports for the key actually in use", async () => {
    const c = clock();
    const limiter = new RiotRateLimiter({
      store: new MemoryWindowStore(),
      windows: ONE_PER_SECOND,
      ...c,
    });

    limiter.learn("euw1", "500:10,30000:600");
    for (let i = 0; i < 10; i++) await limiter.acquire("euw1");

    expect(c.sleep).not.toHaveBeenCalled();
  });

  it("ignores a header it cannot read", async () => {
    const c = clock();
    const limiter = new RiotRateLimiter({
      store: new MemoryWindowStore(),
      windows: ONE_PER_SECOND,
      ...c,
    });

    limiter.learn("euw1", "garbage");
    await limiter.acquire("euw1");
    await limiter.acquire("euw1");

    expect(c.sleep).toHaveBeenCalledTimes(1);
  });

  it("holds everyone off a paused region", async () => {
    const c = clock();
    const limiter = new RiotRateLimiter({
      store: new MemoryWindowStore(),
      windows: ONE_PER_SECOND,
      maxWaitMs: 5_000,
      ...c,
    });

    await limiter.pause("euw1", 30_000);

    await expect(limiter.acquire("euw1")).rejects.toMatchObject({ code: "RIOT_RATE_LIMITED" });
    await expect(limiter.acquire("na1")).resolves.toBeUndefined();
  });
});

describe("RiotRateLimiter priority (ADR-062)", () => {
  const TEN_PER_MINUTE = [{ limit: 10, windowMs: 60_000 }];

  function limiter() {
    const c = clock();
    return {
      c,
      gate: new RiotRateLimiter({
        store: new MemoryWindowStore(),
        windows: TEN_PER_MINUTE,
        maxWaitMs: 5_000,
        ...c,
      }),
    };
  }

  it("stops background work at half of each window", async () => {
    const { gate } = limiter();
    for (let i = 0; i < 5; i++) await gate.acquire("euw1", "background");

    // The sixth would have to wait out the whole minute — past the foreground wait limit, but
    // inside the background one, so it queues rather than failing.
    const sixth = gate.acquire("euw1", "background");
    await expect(sixth).resolves.toBeUndefined();
  });

  it("leaves the other half to visitors, counted in the same window", async () => {
    const { gate, c } = limiter();
    for (let i = 0; i < 5; i++) await gate.acquire("euw1", "background");
    for (let i = 0; i < 5; i++) await gate.acquire("euw1", "foreground");

    expect(c.sleep).not.toHaveBeenCalled();
    await expect(gate.acquire("euw1", "foreground")).rejects.toMatchObject({
      code: "RIOT_RATE_LIMITED",
    });
  });

  it("gives up on background work only past a minute", async () => {
    const c = clock();
    const gate = new RiotRateLimiter({
      store: new MemoryWindowStore(),
      windows: [{ limit: 2, windowMs: 120_000 }],
      ...c,
    });
    await gate.acquire("euw1", "background");

    await expect(gate.acquire("euw1", "background")).rejects.toMatchObject({
      code: "RIOT_RATE_LIMITED",
    });
  });

  it("reads the priority from the context it runs in", async () => {
    const { gate } = limiter();
    await runAsBackground(async () => {
      for (let i = 0; i < 5; i++) await gate.acquire("euw1");
    });

    // Five background slots used; a visitor still has five of their own.
    for (let i = 0; i < 5; i++) await gate.acquire("euw1");
  });
});
