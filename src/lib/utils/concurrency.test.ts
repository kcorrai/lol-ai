import { describe, expect, it, vi } from "vitest";
import { mapWithConcurrency } from "@/lib/utils/concurrency";

/** Resolves after `ms` of real time. Kept tiny — these assert ordering, not duration. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("mapWithConcurrency", () => {
  it("returns results in input order, not completion order", async () => {
    const out = await mapWithConcurrency([30, 10, 20], 3, async (ms) => {
      await wait(ms);
      return ms;
    });

    expect(out).toEqual([30, 10, 20]);
  });

  it("visits every item exactly once", async () => {
    const seen: number[] = [];
    await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      seen.push(n);
      return n;
    });

    expect(seen.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  // The whole point. The Riot limiter is one fixed budget shared by every caller, so an unbounded
  // fan-out spends it all at once and the limiter starts making everyone wait.
  it("never exceeds the limit in flight", async () => {
    let inFlight = 0;
    let peak = 0;

    await mapWithConcurrency(Array.from({ length: 20 }, (_, i) => i), 4, async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await wait(2);
      inFlight--;
      return null;
    });

    expect(peak).toBe(4);
  });

  it("does not start more runners than there are items", async () => {
    let peak = 0;
    let inFlight = 0;

    await mapWithConcurrency([1, 2], 10, async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await wait(2);
      inFlight--;
      return null;
    });

    expect(peak).toBe(2);
  });

  it("handles an empty list without calling the worker", async () => {
    const worker = vi.fn();
    await expect(mapWithConcurrency([], 4, worker)).resolves.toEqual([]);
    expect(worker).not.toHaveBeenCalled();
  });

  it("rejects a limit below one rather than hanging", async () => {
    await expect(mapWithConcurrency([1], 0, async (n) => n)).rejects.toBeInstanceOf(RangeError);
  });

  describe("when a worker throws", () => {
    it("rethrows the first error", async () => {
      const boom = new Error("boom");
      await expect(
        mapWithConcurrency([1, 2, 3], 2, async (n) => {
          if (n === 1) throw boom;
          return n;
        })
      ).rejects.toBe(boom);
    });

    it("stops handing out new items", async () => {
      const started: number[] = [];
      await mapWithConcurrency(Array.from({ length: 50 }, (_, i) => i), 2, async (n) => {
        started.push(n);
        await wait(1);
        throw new Error("always");
      }).catch(() => undefined);

      // The two runners in flight when the first failure lands may each pick up one more before
      // observing it, but nothing like all fifty should have been started.
      expect(started.length).toBeLessThan(10);
    });

    // A bare Promise.all over already-started promises rejects while the rest keep running
    // unobserved. This settles only once nothing is left in flight.
    it("leaves nothing running after it settles", async () => {
      let inFlight = 0;

      await mapWithConcurrency([1, 2, 3, 4], 4, async (n) => {
        inFlight++;
        await wait(n === 1 ? 1 : 15);
        inFlight--;
        if (n === 1) throw new Error("early");
        return n;
      }).catch(() => undefined);

      expect(inFlight).toBe(0);
    });
  });
});
