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
        wardsDestroyed: 6,
        attackDamage: 212,
        abilityPower: 0,
        armor: 90,
        magicResistance: 70,
        attackSpeed: 257,
        lifeSteal: 0,
        // Published by the feed and zero for every participant of every game
        // sampled, which is why neither is mapped.
        criticalChance: 0,
        tenacity: 0,
        items: id === 1 ? [3078, 0, 3047, 0] : [1001],
        perkMetadata: { styleId: 8400, subStyleId: 8300, perks: [8437, 8446] },
      })),
    },
  ],
};

/**
 * The opening window, which the service asks for without a `startingTime` and
 * reads only for its first timestamp. 34:41 before the closing frame — the
 * length of the real game this derivation was verified against.
 */
const OPENING = {
  ...WINDOW,
  frames: [
    {
      rfc460Timestamp: "2025-11-09T11:33:45.575Z",
      gameState: "in_game",
      blueTeam: teamFrame(1, { totalGold: 0, totalKills: 0 }),
      redTeam: teamFrame(6, { totalGold: 0, totalKills: 0 }),
    },
  ],
};

/** Serves the window, opening-window and details endpoints, failing any of them on request. */
function mockFeed({
  details = DETAILS as unknown,
  failDetails = false,
  failOpening = false,
  opening = OPENING as unknown,
} = {}): void {
  global.fetch = vi.fn(async (url: string) => {
    if (url.includes("/details/")) {
      if (failDetails) throw new Error("no details for this game");
      return { ok: true, status: 200, json: async () => details };
    }
    // No `startingTime` is the request for the start of the game, which is the
    // only thing either feed publishes a game's length from.
    if (!new URL(url).searchParams.has("startingTime")) {
      if (failOpening) throw new Error("no opening window for this game");
      return { ok: true, status: 200, json: async () => opening };
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

    expect(completedKeys[0]).toEqual(["esports:game:g1:v2:fresh", 30]);
    // A mid-game snapshot must never be served later as the final result.
    expect(liveKeys[0][0]).toBe("esports:game:g1:live:v2:fresh");
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

  it("measures the game from the opening window and the closing frame", async () => {
    mockFeed();

    const stats = await getGameStats("g1", { completed: true, now: NOW });
    expect(stats?.firstFrameAt).toBe("2025-11-09T11:33:45.575Z");
    expect(stats?.durationSeconds).toBe(2081);
  });

  it("asks for the opening window without a starting time", async () => {
    mockFeed();
    await getGameStats("g1", { completed: true, now: NOW });

    const urls = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map(
      (call) => call[0] as string
    );
    const opening = urls.filter(
      (url) => url.includes("/window/") && !new URL(url).searchParams.has("startingTime")
    );
    // Exactly one, and it is what the duration is measured from.
    expect(opening).toHaveLength(1);
  });

  it("caches the opening window for a month even while the game is live", async () => {
    mockFeed();
    await getGameStats("g1", { completed: false, now: NOW });

    // A game's first frame is immutable the moment it exists, so a live game
    // must not re-fetch it on every thirty-second poll.
    const start = mockSetCached.mock.calls.find(
      (call) => call[0] === "esports:game:g1:start:v2:fresh"
    );
    expect(start?.[3]).toBe(30);
  });

  it("has no duration when the feed published no opening window", async () => {
    mockFeed({ failOpening: true });

    const stats = await getGameStats("g1", { completed: true, now: NOW });
    // The scoreboard still renders; the per-minute columns on it dash out
    // rather than being computed against a length nobody measured.
    expect(stats?.blue.participants[0].kills).toBe(1);
    expect(stats?.firstFrameAt).toBeNull();
    expect(stats?.durationSeconds).toBeNull();
  });

  it("refuses a duration the frames cannot support", async () => {
    // A feed that repeats the closing frame as the opening one would otherwise
    // report a zero-second game and send every per-minute rate to infinity.
    mockFeed({ opening: WINDOW });

    const stats = await getGameStats("g1", { completed: true, now: NOW });
    expect(stats?.durationSeconds).toBeNull();
  });

  it("reads the end-game stat line", async () => {
    mockFeed();

    const stats = await getGameStats("g1", { completed: true, now: NOW });
    expect(stats?.blue.participants[0].finalStats).toEqual({
      attackDamage: 212,
      // A real zero — a bruiser genuinely ends the game on no ability power —
      // rather than a gap, which is why the whole line is null or nothing.
      abilityPower: 0,
      armor: 90,
      magicResistance: 70,
      attackSpeed: 257,
      lifeSteal: 0,
    });
  });

  it("has no stat line for a game the details feed published nothing for", async () => {
    mockFeed({ failDetails: true });

    const stats = await getGameStats("g1", { completed: true, now: NOW });
    expect(stats?.blue.participants[0].finalStats).toBeNull();
  });

  it("reads wards killed as well as wards placed", async () => {
    mockFeed();

    const stats = await getGameStats("g1", { completed: true, now: NOW });
    expect(stats?.blue.participants[0].wardsPlaced).toBe(18);
    expect(stats?.blue.participants[0].wardsDestroyed).toBe(6);
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

  it("writes under a version-scoped key so an older shape is never read back", async () => {
    mockFeed();
    await getGameStats("g1", { completed: true, now: NOW });

    // The bug this guards: the mapper runs the payload through Zod, which drops
    // keys the schema does not name, and a completed game is cached for thirty
    // days. Adding the end-game stat line therefore left every already-cached
    // game rendering a sheet of zeros until the key moved with the shape.
    const keys = mockSetCached.mock.calls.map((call) => call[0] as string);
    expect(keys.every((key) => key.includes(":v2:"))).toBe(true);
  });
});
