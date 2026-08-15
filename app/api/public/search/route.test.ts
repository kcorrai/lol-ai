import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot/services/playerIndexService", () => ({ searchPlayers: vi.fn() }));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  checkRateLimit: vi.fn(),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { searchPlayers } from "@/domains/riot/services/playerIndexService";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { routeRequest } from "@/test/apiRoute";
import { GET } from "./route";

const HIT = {
  puuid: "puuid-1",
  gameName: "Faker",
  tagLine: "KR1",
  region: "kr",
  profileIconId: 12,
  summonerLevel: 700,
  seenCount: 40,
  lastSeenAt: new Date("2026-08-01"),
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, limit: 150, remaining: 149 } as never);
  vi.mocked(searchPlayers).mockResolvedValue([HIT]);
});

describe("GET /api/public/search", () => {
  it("returns matching players without requiring a session", async () => {
    const res = await GET(routeRequest("/api/public/search?q=faker"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { players: unknown[] } };
    expect(body.data.players).toEqual([
      {
        puuid: "puuid-1",
        gameName: "Faker",
        tagLine: "KR1",
        region: "kr",
        profileIconId: 12,
        summonerLevel: 700,
      },
    ]);
  });

  it("does not leak the internal ranking signal to the client", async () => {
    const res = await GET(routeRequest("/api/public/search?q=faker"));

    const body = (await res.json()) as { data: { players: Record<string, unknown>[] } };
    expect(body.data.players[0]).not.toHaveProperty("seenCount");
    expect(body.data.players[0]).not.toHaveProperty("lastSeenAt");
  });

  it("passes the region through when one is given", async () => {
    await GET(routeRequest("/api/public/search?q=faker&region=KR"));

    expect(searchPlayers).toHaveBeenCalledWith("faker", { region: "kr", limit: undefined });
  });

  it("rejects an unknown region", async () => {
    const res = await GET(routeRequest("/api/public/search?q=faker&region=zz9"));

    expect(res.status).toBe(400);
    expect(searchPlayers).not.toHaveBeenCalled();
  });

  it("rejects a missing query", async () => {
    const res = await GET(routeRequest("/api/public/search"));

    expect(res.status).toBe(400);
  });

  it("caps the limit rather than letting a caller ask for the whole index", async () => {
    const res = await GET(routeRequest("/api/public/search?q=faker&limit=500"));

    expect(res.status).toBe(400);
    expect(searchPlayers).not.toHaveBeenCalled();
  });

  it("returns 429 without touching the index when over the limit", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      limit: 150,
      remaining: 0,
      retryAfterMs: 1000,
    } as never);

    const res = await GET(routeRequest("/api/public/search?q=faker"));

    expect(res.status).toBe(429);
    expect(searchPlayers).not.toHaveBeenCalled();
  });

  it("answers with an empty list when the index errors, so the box stays usable", async () => {
    vi.mocked(searchPlayers).mockRejectedValue(new Error("connection lost"));

    const res = await GET(routeRequest("/api/public/search?q=faker"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(expect.objectContaining({ data: { players: [] } }));
  });
});
