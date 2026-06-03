import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rateLimit";

// Tests always exercise the in-memory fallback path (no UPSTASH_REDIS_REST_URL in test env).
// The injectable `now` parameter keeps the in-memory path deterministic.

describe("checkRateLimit", () => {
  it("allows requests within the limit", async () => {
    const key = `rl-test-within:${Date.now()}`;
    const config = { limit: 3, windowMs: 60_000 };
    const now = Date.now();

    const r1 = await checkRateLimit(key, config, now);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await checkRateLimit(key, config, now + 100);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await checkRateLimit(key, config, now + 200);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks the request that exceeds the limit", async () => {
    const key = `rl-test-block:${Date.now()}`;
    const config = { limit: 2, windowMs: 60_000 };
    const now = Date.now();

    await checkRateLimit(key, config, now);
    await checkRateLimit(key, config, now + 100);

    const blocked = await checkRateLimit(key, config, now + 200);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(60_000);
  });

  it("returns correct Retry-After time", async () => {
    const key = `rl-test-retry:${Date.now()}`;
    const config = { limit: 1, windowMs: 3_600_000 };
    const now = Date.now();

    await checkRateLimit(key, config, now);
    const blocked = await checkRateLimit(key, config, now + 1_000);

    expect(blocked.retryAfterMs).toBeCloseTo(3_599_000, -3);
  });

  it("resets the window after windowMs elapses", async () => {
    const key = `rl-test-reset:${Date.now()}`;
    const config = { limit: 1, windowMs: 1_000 };
    const now = Date.now();

    const first = await checkRateLimit(key, config, now);
    expect(first.allowed).toBe(true);

    const blocked = await checkRateLimit(key, config, now + 500);
    expect(blocked.allowed).toBe(false);

    const afterReset = await checkRateLimit(key, config, now + 1_001);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(0);
  });

  it("tracks different keys independently", async () => {
    const config = { limit: 1, windowMs: 60_000 };
    const now = Date.now();
    const ts = Date.now();

    const a = await checkRateLimit(`rl-test-keys-a:${ts}`, config, now);
    const b = await checkRateLimit(`rl-test-keys-b:${ts}`, config, now);

    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
  });

  it("reports the correct limit in all responses", async () => {
    const key = `rl-test-meta:${Date.now()}`;
    const config = { limit: 5, windowMs: 60_000 };
    const now = Date.now();

    const r = await checkRateLimit(key, config, now);
    expect(r.limit).toBe(5);
  });
});
