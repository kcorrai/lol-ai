import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { memoized, __resetFreshMemo } from "./freshMemo";

const DAY = 1;

describe("memoized", () => {
  beforeEach(() => __resetFreshMemo());
  afterEach(() => vi.useRealTimers());

  it("loads once for repeated reads inside the window", async () => {
    const load = vi.fn().mockResolvedValue("teams");

    expect(await memoized("k", DAY, false, load)).toBe("teams");
    expect(await memoized("k", DAY, false, load)).toBe("teams");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("shares one in-flight load between concurrent readers", async () => {
    let resolve: (value: string) => void = () => undefined;
    const load = vi.fn(() => new Promise<string>((r) => (resolve = r)));

    const reads = Promise.all([
      memoized("k", DAY, false, load),
      memoized("k", DAY, false, load),
      memoized("k", DAY, false, load),
    ]);
    resolve("teams");

    expect(await reads).toEqual(["teams", "teams", "teams"]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("loads again once five minutes have passed", async () => {
    vi.useFakeTimers();
    const load = vi.fn().mockResolvedValueOnce("old").mockResolvedValueOnce("new");

    await memoized("k", DAY, false, load);
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    expect(await memoized("k", DAY, false, load)).toBe("new");
  });

  it("never outlives the cache's own fresh window", async () => {
    vi.useFakeTimers();
    const thirtySeconds = 30 / 86_400;
    const load = vi.fn().mockResolvedValueOnce("old").mockResolvedValueOnce("new");

    await memoized("k", thirtySeconds, false, load);
    vi.advanceTimersByTime(31_000);

    expect(await memoized("k", thirtySeconds, false, load)).toBe("new");
  });

  it("does not keep a null, so a recovered feed is seen on the next read", async () => {
    const load = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce("teams");

    expect(await memoized("k", DAY, false, load)).toBeNull();
    expect(await memoized("k", DAY, false, load)).toBe("teams");
  });

  it("does not keep a failure", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce("teams");

    await expect(memoized("k", DAY, false, load)).rejects.toThrow("down");
    expect(await memoized("k", DAY, false, load)).toBe("teams");
  });

  it("reloads on force and serves the new value afterwards", async () => {
    const load = vi.fn().mockResolvedValueOnce("old").mockResolvedValueOnce("new");

    await memoized("k", DAY, false, load);
    expect(await memoized("k", DAY, true, load)).toBe("new");
    expect(await memoized("k", DAY, false, load)).toBe("new");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("keeps keys apart", async () => {
    const teams = vi.fn().mockResolvedValue("teams");
    const leagues = vi.fn().mockResolvedValue("leagues");

    expect(await memoized("a", DAY, false, teams)).toBe("teams");
    expect(await memoized("b", DAY, false, leagues)).toBe("leagues");
  });
});
