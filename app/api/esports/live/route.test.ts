import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { rateLimit } = vi.hoisted(() => ({
  rateLimit: { allowed: true, retryAfterMs: 0, limit: 60, remaining: 59 },
}));

vi.mock("@/lib/api/rateLimit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/rateLimit")>("@/lib/api/rateLimit");
  return { ...actual, checkRateLimit: vi.fn(async () => rateLimit) };
});
vi.mock("@/domains/esports", () => ({
  getLiveEvents: vi.fn(async () => [{ matchId: "m1" }]),
  getGameStats: vi.fn(async () => ({ gameId: "g1", finished: false })),
}));

import { GET } from "./route";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { getLiveEvents, getGameStats } from "@/domains/esports";

function request(url: string): NextRequest {
  return new NextRequest(new Request(url));
}

describe("GET /api/esports/live", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimit.allowed = true;
  });

  it("returns the live events and a short edge cache", async () => {
    const res = await GET(request("http://localhost/api/esports/live"));

    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ events: [{ matchId: "m1" }] });
    // Shorter than the client's 30s poll, so a shared CDN copy is never why a
    // scoreboard looks frozen.
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=20");
    expect(getGameStats).not.toHaveBeenCalled();
  });

  it("returns one game's live stats when asked for it", async () => {
    const res = await GET(request("http://localhost/api/esports/live?gameId=g1"));

    expect((await res.json()).data).toEqual({ game: { gameId: "g1", finished: false } });
    expect(getGameStats).toHaveBeenCalledWith("g1", { completed: false });
    expect(getLiveEvents).not.toHaveBeenCalled();
  });

  it("refuses once the caller is over the limit, without touching the feed", async () => {
    rateLimit.allowed = false;
    rateLimit.retryAfterMs = 5_000;

    const res = await GET(request("http://localhost/api/esports/live"));

    expect(res.status).toBe(429);
    expect(getLiveEvents).not.toHaveBeenCalled();
    expect(checkRateLimit).toHaveBeenCalledOnce();
  });
});
