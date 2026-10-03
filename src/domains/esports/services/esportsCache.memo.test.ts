import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn(),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { cachedComputation, cachedResource, cachedValue, TTL } from "./esportsCache";
import { __resetFreshMemo } from "./freshMemo";
import { getCached, setCached } from "@/lib/ai/aiCache";

const mockGetCached = getCached as unknown as ReturnType<typeof vi.fn>;
const mockSetCached = setCached as unknown as ReturnType<typeof vi.fn>;

// The case LA-136 measured: one 1.3MB entry read by every prerendered page.
describe("memo option", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetFreshMemo();
    mockSetCached.mockResolvedValue(undefined);
    mockGetCached.mockImplementation(async (key: string) =>
      key.endsWith(":fresh") ? { teams: 1 } : null
    );
  });

  it("reads a memoised resource from the cache once, however many pages ask", async () => {
    const read = (): Promise<unknown> =>
      cachedResource({
        key: "teams",
        type: "esports-test",
        ttlDays: TTL.static,
        schema: z.unknown(),
        fetcher: vi.fn(),
        map: (raw) => raw,
        memo: true,
      });

    await Promise.all([read(), read(), read()]);
    await read();

    expect(mockGetCached).toHaveBeenCalledTimes(1);
  });

  it("leaves resources that did not opt in reading the cache every time", async () => {
    const read = (): Promise<unknown> =>
      cachedResource({
        key: "schedule",
        type: "esports-test",
        ttlDays: TTL.schedule,
        schema: z.unknown(),
        fetcher: vi.fn(),
        map: (raw) => raw,
      });

    await read();
    await read();

    expect(mockGetCached).toHaveBeenCalledTimes(2);
  });

  it("memoises a computation and a cached-value read the same way", async () => {
    const compute = vi.fn();
    const computed = (): Promise<unknown> =>
      cachedComputation({
        key: "sample",
        type: "esports-test",
        ttlDays: TTL.standings,
        compute,
        memo: true,
      });

    await computed();
    await computed();
    await cachedValue("other", 1, TTL.standings);
    await cachedValue("other", 1, TTL.standings);

    expect(compute).not.toHaveBeenCalled();
    expect(mockGetCached).toHaveBeenCalledTimes(2);
  });
});
