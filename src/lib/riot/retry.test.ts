import { afterEach, describe, expect, it, vi } from "vitest";
import { withRetry } from "@/lib/riot/retry";
import { normalizeRiotError } from "@/lib/riot/errors";

// Every delay in these tests is sub-millisecond on purpose — the point is the number of attempts
// and the shape of the backoff, not the wall clock.
const FAST = { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 2 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("withRetry", () => {
  it("returns the first success without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn, FAST)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  // The regression this file exists for. ApiError names its field `statusCode`, and withRetry read
  // only `status` — so no Riot error ever matched a retryable status and the whole layer was inert.
  it("retries the errors normalizeRiotError actually produces", async () => {
    for (const httpStatus of [429, 500, 502, 503, 504]) {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(normalizeRiotError(httpStatus))
        .mockResolvedValue("ok");

      await expect(withRetry(fn, FAST)).resolves.toBe("ok");
      expect(fn, `HTTP ${httpStatus} should have been retried`).toHaveBeenCalledTimes(2);
    }
  });

  it("gives up after maxAttempts and rethrows the last error", async () => {
    const fn = vi.fn().mockRejectedValue(normalizeRiotError(503));
    await expect(withRetry(fn, FAST)).rejects.toMatchObject({ code: "RIOT_API_UNAVAILABLE" });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("propagates a non-retryable status immediately", async () => {
    const fn = vi.fn().mockRejectedValue(normalizeRiotError(404));
    await expect(withRetry(fn, FAST)).rejects.toMatchObject({ code: "RIOT_NOT_FOUND" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("still understands a raw error that names the field `status`", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("boom"), { status: 503 }))
      .mockResolvedValue("ok");
    await expect(withRetry(fn, FAST)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries an aborted or timed-out request, which carries no status at all", async () => {
    for (const name of ["AbortError", "TimeoutError"]) {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(Object.assign(new Error("timed out"), { name }))
        .mockResolvedValue("ok");
      await expect(withRetry(fn, FAST)).resolves.toBe("ok");
      expect(fn, `${name} should have been retried`).toHaveBeenCalledTimes(2);
    }
  });

  it("propagates an ordinary error rather than retrying it", async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError("bad code"));
    await expect(withRetry(fn, FAST)).rejects.toBeInstanceOf(TypeError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  describe("backoff", () => {
    it("jitters Retry-After so rate-limited callers do not all wake together", async () => {
      // Two callers, same Retry-After, different Math.random draws: the delays must differ, or
      // honouring the header just rebuilds the burst that produced the 429.
      const delays: number[] = [];
      const timeout = vi
        .spyOn(globalThis, "setTimeout")
        .mockImplementation(((cb: () => void, ms?: number) => {
          delays.push(ms ?? 0);
          cb();
          return 0 as unknown as NodeJS.Timeout;
        }) as unknown as typeof setTimeout);

      vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(1);

      for (let i = 0; i < 2; i++) {
        const fn = vi
          .fn()
          .mockRejectedValueOnce(normalizeRiotError(429, 2)) // Retry-After: 2s
          .mockResolvedValue("ok");
        await withRetry(fn, FAST);
      }

      timeout.mockRestore();
      expect(delays).toHaveLength(2);
      // Never shorter than the header asked for, and never the same value twice.
      expect(delays[0]).toBeGreaterThanOrEqual(2000);
      expect(delays[1]).toBeGreaterThanOrEqual(2000);
      expect(delays[0]).not.toBe(delays[1]);
    });

    it("caps exponential backoff at maxDelayMs", async () => {
      const delays: number[] = [];
      const timeout = vi
        .spyOn(globalThis, "setTimeout")
        .mockImplementation(((cb: () => void, ms?: number) => {
          delays.push(ms ?? 0);
          cb();
          return 0 as unknown as NodeJS.Timeout;
        }) as unknown as typeof setTimeout);

      const fn = vi.fn().mockRejectedValue(normalizeRiotError(503));
      await expect(
        withRetry(fn, { maxAttempts: 4, baseDelayMs: 1000, maxDelayMs: 1500 })
      ).rejects.toBeDefined();

      timeout.mockRestore();
      expect(delays.every((d) => d <= 1500)).toBe(true);
    });
  });
});
