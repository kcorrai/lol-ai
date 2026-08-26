import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __clearLastGoodJson, fetchJsonLastGood } from "./lastGoodJson";

const URL_A = "https://example.test/catalogue.json";

function ok(body: unknown): Response {
  return { ok: true, json: async () => body } as Response;
}

describe("fetchJsonLastGood", () => {
  beforeEach(() => {
    __clearLastGoodJson();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the parsed body and serves the next call from memory", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ v: 1 }));

    expect(await fetchJsonLastGood(URL_A, { ttlSeconds: 60 })).toEqual({ v: 1 });
    expect(await fetchJsonLastGood(URL_A, { ttlSeconds: 60 })).toEqual({ v: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never asks the framework to revalidate for us — that is the bug being fixed", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ v: 1 }));

    await fetchJsonLastGood(URL_A);

    const init = fetchMock.mock.calls[0][1] as RequestInit & { next?: unknown };
    expect(init.next).toBeUndefined();
    // `no-cache`, not `no-store`: the same "do not store this" to the framework, minus
    // the DynamicServerError that `no-store` throws inside a prerender (ADR-045).
    expect(init.cache).toBe("no-cache");
    expect(init.signal).toBeDefined();
  });

  it("resolves undefined rather than rejecting when the host is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));

    await expect(fetchJsonLastGood(URL_A)).resolves.toBeUndefined();
  });

  it("serves the last good answer once the host goes down", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ v: 1 }));

    expect(await fetchJsonLastGood(URL_A, { ttlSeconds: 1 })).toEqual({ v: 1 });

    // Past the TTL, so the next read goes upstream — and upstream is gone.
    vi.advanceTimersByTime(2000);
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    // Stale on purpose: a patch-old catalogue beats an empty one.
    expect(await fetchJsonLastGood(URL_A, { ttlSeconds: 1 })).toEqual({ v: 1 });
  });

  it("treats a non-ok status the same as an unreachable host", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 503 } as Response);

    await expect(fetchJsonLastGood(URL_A)).resolves.toBeUndefined();
  });

  it("collapses concurrent readers into one request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ v: 1 }));

    const [a, b] = await Promise.all([
      fetchJsonLastGood(URL_A, { ttlSeconds: 60 }),
      fetchJsonLastGood(URL_A, { ttlSeconds: 60 }),
    ]);

    expect(a).toEqual({ v: 1 });
    expect(b).toEqual({ v: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
