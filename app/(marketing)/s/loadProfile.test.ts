import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot/services/previewService", () => ({ buildPublicProfile: vi.fn() }));
vi.mock("next/headers", () => ({ headers: () => new Headers({ "x-real-ip": "203.0.113.7" }) }));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  checkRateLimit: vi.fn(),
}));

// `cache` ships only in React's server build, which the jsdom test environment does not load.
// The identity shim keeps the module importable; per-request memoisation is Next's job and is
// verified against the running server, not here.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  cache: <T>(fn: T): T => fn,
}));

import { buildPublicProfile } from "@/domains/riot/services/previewService";
import { ApiError } from "@/lib/api/errors";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { loadProfile } from "./loadProfile";

const PREVIEW = {
  summoner: { gameName: "kaanproak0" },
  recentMatches: [],
  topChampions: [],
  mastery: [],
  scoreboards: {},
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(buildPublicProfile).mockResolvedValue(PREVIEW as never);
  vi.mocked(checkRateLimit).mockResolvedValue({
    allowed: true,
    retryAfterMs: 0,
    limit: 10,
    remaining: 9,
  });
});

/** Run the gate `loadProfile` hands to the builder, the way the builder does on a cache miss. */
function runGateOnMiss(): void {
  vi.mocked(buildPublicProfile).mockImplementation(async (_n, _t, _r, options) => {
    await options?.beforeRiot?.();
    return PREVIEW as never;
  });
}

describe("loadProfile", () => {
  it("returns the preview for a known player", async () => {
    // Distinct name per test: `cache()` memoises on arguments for the whole module lifetime.
    const result = await loadProfile("kaanproak0", "TR1", "tr1");

    expect(result).toEqual({ ok: true, data: PREVIEW });
  });

  it("rejects an unknown region without calling Riot", async () => {
    const result = await loadProfile("someone", "TR1", "zz9");

    expect(result).toEqual({ ok: false, reason: "not-found" });
    expect(buildPublicProfile).not.toHaveBeenCalled();
  });

  it("separates Riot throttling from a missing player, because only one is worth retrying", async () => {
    vi.mocked(buildPublicProfile).mockRejectedValue(
      new ApiError("RIOT_RATE_LIMITED", "slow down", 503)
    );

    expect(await loadProfile("throttled", "TR1", "tr1")).toEqual({
      ok: false,
      reason: "rate-limited",
    });
  });

  it("treats any other Riot failure as a miss rather than surfacing an error page", async () => {
    vi.mocked(buildPublicProfile).mockRejectedValue(new Error("socket hang up"));

    expect(await loadProfile("broken", "TR1", "tr1")).toEqual({ ok: false, reason: "not-found" });
  });

  it("limits fresh lookups per visitor address", async () => {
    runGateOnMiss();

    await loadProfile("fresh-one", "TR1", "tr1");

    expect(checkRateLimit).toHaveBeenCalledWith("profile-lookup:203.0.113.7", {
      limit: 10,
      windowMs: 600_000,
    });
  });

  it("says the visitor is throttled — not that the player is missing — once the limit is spent", async () => {
    runGateOnMiss();
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterMs: 60_000,
      limit: 10,
      remaining: 0,
    });

    expect(await loadProfile("fresh-two", "TR1", "tr1")).toEqual({
      ok: false,
      reason: "throttled",
    });
  });
});
