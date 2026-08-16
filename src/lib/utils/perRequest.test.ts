import { describe, it, expect, vi } from "vitest";
import { perRequest } from "./perRequest";

describe("perRequest", () => {
  /**
   * The regression this guards: `React.cache` exists in the React build Next
   * ships and not in the one the tests run against. Importing it directly took
   * out four suites with `TypeError: cache is not a function`, and the failure
   * was nowhere near the service that caused it.
   */
  it("returns a working function even where React has no cache", () => {
    const wrapped = perRequest((value: number) => value * 2);

    expect(typeof wrapped).toBe("function");
    expect(wrapped(21)).toBe(42);
  });

  it("passes every argument through", () => {
    const spy = vi.fn((a: string, b: number) => `${a}:${b}`);
    const wrapped = perRequest(spy);

    expect(wrapped("x", 1)).toBe("x:1");
    expect(spy).toHaveBeenCalledWith("x", 1);
  });

  it("does not swallow a rejection", async () => {
    const wrapped = perRequest(async () => {
      throw new Error("upstream is down");
    });

    await expect(wrapped()).rejects.toThrow("upstream is down");
  });
});
