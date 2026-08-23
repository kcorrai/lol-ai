import { describe, expect, it, vi } from "vitest";
import { dedup } from "@/lib/riot/dedup";

describe("dedup", () => {
  it("collapses concurrent callers of the same key into one call", async () => {
    let resolveIt: (v: string) => void = () => {};
    const fn = vi.fn(
      () =>
        new Promise<string>((r) => {
          resolveIt = r;
        })
    );

    const a = dedup("k", fn);
    const b = dedup("k", fn);
    resolveIt("payload");

    expect(await a).toBe("payload");
    expect(await b).toBe("payload");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("keeps different keys apart", async () => {
    const fn = vi.fn(async () => "x");
    await Promise.all([dedup("a", fn), dedup("b", fn)]);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  // Without this the first fetch of a match would be the only one the process ever made.
  it("releases the key once settled so a later call fetches again", async () => {
    const fn = vi.fn(async () => "x");
    await dedup("k2", fn);
    await dedup("k2", fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("releases the key after a rejection too", async () => {
    const failing = vi.fn(async () => {
      throw new Error("boom");
    });
    await expect(dedup("k3", failing)).rejects.toThrow("boom");
    await expect(dedup("k3", failing)).rejects.toThrow("boom");
    expect(failing).toHaveBeenCalledTimes(2);
  });
});
