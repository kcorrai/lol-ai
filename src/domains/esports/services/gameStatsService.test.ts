import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(async () => null),
  setCached: vi.fn(async () => undefined),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getGameStats } from "./gameStatsService";
import { setCached } from "@/lib/ai/aiCache";

const mockSetCached = setCached as unknown as ReturnType<typeof vi.fn>;

const NOW = new Date("2026-08-16T12:00:00Z");

function meta(prefix: string, startId: number, teamId: string) {
  return {
    esportsTeamId: teamId,
    participantMetadata: [1, 2, 3, 4, 5].map((n) => ({
      participantId: startId + n - 1,
      esportsPlayerId: `p${startId + n - 1}`,
      summonerName: `${prefix} Player${n}`,
      championId: ["Rumble", "MonkeyKing", "Ryze", "Ashe", "Braum"][n - 1],
      role: ["top", "jungle", "mid", "bottom", "support"][n - 1],
    })),
  };
}

function teamFrame(startId: number, over: Record<string, unknown> = {}) {
  return {
    totalGold: 61203,
    totalKills: 11,
    towers: 2,
    inhibitors: 0,
    barons: 1,
    dragons: ["ocean", "infernal"],
    participants: [1, 2, 3, 4, 5].map((n) => ({
      participantId: startId + n - 1,
      level: 17,
      kills: n,
      deaths: 1,
      assists: 3,
      creepScore: 200 + n,
      totalGold: 11000 + n,
    })),
    ...over,
  };
}

const WINDOW = {
  esportsGameId: "g1",
  gameMetadata: {
    patchVersion: "15.20.719.545",
    blueTeamMetadata: meta("KT", 1, "team-kt"),
    redTeamMetadata: meta("T1", 6, "team-t1"),
  },
  frames: [
    {
      rfc460Timestamp: "2025-11-09T12:08:26.575Z",
      gameState: "finished",
      blueTeam: teamFrame(1),
      redTeam: teamFrame(6, { totalGold: 74584, totalKills: 23 }),
    },
  ],
};

const DETAILS = {
  frames: [
    {
      rfc460Timestamp: "2025-11-09T12:08:26.575Z",
      participants: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => ({
        participantId: id,
        killParticipation: 0.72,
        championDamageShare: 0.25,
        wardsPlaced: 18,
        items: id === 1 ? [3078, 0, 3047, 0] : [1001],
        perkMetadata: { styleId: 8400, subStyleId: 8300, perks: [8437, 8446] },
      })),
    },
  ],
};

/** Serves the window and details endpoints, optionally failing one of them. */
function mockFeed({ details = DETAILS as unknown, failDetails = false } = {}): void {
  global.fetch = vi.fn(async (url: string) => {
    if (url.includes("/details/")) {
      if (failDetails) throw new Error("no details for this game");
      return { ok: true, status: 200, json: async () => details };
    }
    return { ok: true, status: 200, json: async () => WINDOW };
  }) as unknown as typeof fetch;
}

describe("getGameStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("merges the window and details frames into one scoreboard", async () => {
    mockFeed();

    const stats = await getGameStats("g1", { completed: true, now: NOW });
    expect(stats).not.toBeNull();
    expect(stats?.patch).toBe("15.20");
    expect(stats?.finished).toBe(true);
    expect(stats?.blue.gold).toBe(61203);
    expect(stats?.red.kills).toBe(23);

    const first = stats?.blue.participants[0];
    expect(first).toMatchObject({
      // KDA and CS come from the window, KP and items from the details frame.
      kills: 1,
      creepScore: 201,
      killParticipation: 0.72,
      damageShare: 0.25,
    });
    expect(first?.runes?.primaryStyle).toBe(8400);
  });

  it("strips the team prefix the feed puts in front of every handle", async () => {
    mockFeed();

    const stats = await getGameStats("g1", { completed: true, now: NOW });
    expect(stats?.blue.participants[0].handle).toBe("Player1");
    expect(stats?.blue.participants[0].fullHandle).toBe("KT Player1");
  });

  it("drops empty item slots rather than rendering them as items", async () => {
    mockFeed();

    const stats = await getGameStats("g1", { completed: true, now: NOW });
    expect(stats?.blue.participants[0].items).toEqual([3078, 3047]);
  });

  it("still renders a scoreboard when the details feed has nothing", async () => {
    mockFeed({ failDetails: true });

    const stats = await getGameStats("g1", { completed: true, now: NOW });
    // The window alone carries KDA, CS and gold — the game is not unrenderable
    // just because the richer feed is missing.
    expect(stats?.blue.participants[0].kills).toBe(1);
    expect(stats?.blue.participants[0].killParticipation).toBeNull();
    expect(stats?.blue.participants[0].items).toEqual([]);
  });

  it("keeps the team id the game data itself reports", async () => {
    mockFeed();

    const stats = await getGameStats("g1", { completed: true, now: NOW });
    // The event feed disagrees with this on real matches; the side that played
    // is the one named beside the five players.
    expect(stats?.blue.teamId).toBe("team-kt");
    expect(stats?.red.teamId).toBe("team-t1");
  });

  it("caches a completed game for a month and a live one for seconds, under different keys", async () => {
    mockFeed();
    await getGameStats("g1", { completed: true, now: NOW });
    const completedKeys = mockSetCached.mock.calls.map((c) => [c[0], c[3]]);

    vi.clearAllMocks();
    mockFeed();
    await getGameStats("g1", { completed: false, now: NOW });
    const liveKeys = mockSetCached.mock.calls.map((c) => [c[0], c[3]]);

    expect(completedKeys[0]).toEqual(["esports:game:g1:fresh", 30]);
    // A mid-game snapshot must never be served later as the final result.
    expect(liveKeys[0][0]).toBe("esports:game:g1:live:fresh");
    expect(liveKeys[0][1]).toBeLessThan(1);
  });

  it("asks the feed for a window in the past — it rejects future times", async () => {
    mockFeed();
    await getGameStats("g1", { completed: true, now: NOW });

    const url = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const startingTime = new URL(url).searchParams.get("startingTime");
    expect(startingTime).toBe("2026-08-16T11:58:00Z");
    expect(new Date(startingTime as string).getTime()).toBeLessThan(NOW.getTime());
  });

  it("returns null when the feed has no frames for the game", async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ...WINDOW, frames: [] }),
    })) as unknown as typeof fetch;

    expect(await getGameStats("g1", { completed: true, now: NOW })).toBeNull();
  });

  it("returns null when the feed is down and nothing was cached", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch;

    expect(await getGameStats("g1", { completed: true, now: NOW })).toBeNull();
  });
});
