import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// The route validates, delegates and responds (CLAUDE.md 2.2): the feed reads
// are mocked, and what is under test is which read a query string reaches.
vi.mock("@/domains/esports", () => ({
  getLiveEvents: vi.fn(),
  getGameStats: vi.fn(),
  getGameTimeline: vi.fn(),
}));

vi.mock("@/lib/api/rateLimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
  getIp: () => "127.0.0.1",
  rateLimitResponse: vi.fn(),
}));

import { GET } from "@/../app/api/esports/live/route";
import { getGameStats, getGameTimeline, getLiveEvents } from "@/domains/esports";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

const mockEvents = getLiveEvents as unknown as ReturnType<typeof vi.fn>;
const mockStats = getGameStats as unknown as ReturnType<typeof vi.fn>;
const mockTimeline = getGameTimeline as unknown as ReturnType<typeof vi.fn>;
const mockRateLimit = checkRateLimit as unknown as ReturnType<typeof vi.fn>;
const mockRateLimitResponse = rateLimitResponse as unknown as ReturnType<typeof vi.fn>;

const TIMELINE = {
  gameId: "g1",
  startedAt: "2026-09-27T18:00:00Z",
  intervalSeconds: 240,
  truncated: false,
  durationSeconds: 480,
  samples: [],
};

function get(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/esports/live${query}`);
}

async function data(res: Response): Promise<Record<string, unknown>> {
  return ((await res.json()) as { data: Record<string, unknown> }).data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockResolvedValue({ allowed: true });
});

describe("GET /api/esports/live", () => {
  it("lists live events when no game is named", async () => {
    mockEvents.mockResolvedValue([{ matchId: "m1" }]);

    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await data(res)).toEqual({ events: [{ matchId: "m1" }] });
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=20");
    expect(mockStats).not.toHaveBeenCalled();
  });

  it("answers one game's scoreboard for a game id", async () => {
    mockStats.mockResolvedValue({ finished: false });

    const res = await GET(get("?gameId=g1"));

    expect(await data(res)).toEqual({ game: { finished: false } });
    expect(mockStats).toHaveBeenCalledWith("g1", { completed: false });
    expect(mockTimeline).not.toHaveBeenCalled();
  });

  it("answers the gold curve, and only the curve, when the timeline flag is set", async () => {
    mockTimeline.mockResolvedValue(TIMELINE);

    const res = await GET(get("?gameId=g1&timeline=1"));

    expect(await data(res)).toEqual({ timeline: TIMELINE });
    expect(mockTimeline).toHaveBeenCalledWith("g1", { completed: false });
    expect(mockStats).not.toHaveBeenCalled();
  });

  it("answers a null timeline before the walk has a sample", async () => {
    mockTimeline.mockResolvedValue(null);

    const res = await GET(get("?gameId=g1&timeline=1"));

    expect(res.status).toBe(200);
    expect(await data(res)).toEqual({ timeline: null });
  });

  it("ignores the timeline flag without a game id", async () => {
    mockEvents.mockResolvedValue([]);

    await GET(get("?timeline=1"));

    expect(mockEvents).toHaveBeenCalled();
    expect(mockTimeline).not.toHaveBeenCalled();
  });

  it("refuses before reading the feed when rate limited", async () => {
    mockRateLimit.mockResolvedValue({ allowed: false, retryAfterMs: 1000, limit: 60 });
    mockRateLimitResponse.mockReturnValue(new Response(null, { status: 429 }));

    const res = await GET(get("?gameId=g1&timeline=1"));

    expect(res.status).toBe(429);
    expect(mockTimeline).not.toHaveBeenCalled();
  });
});
