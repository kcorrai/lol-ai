import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    creatorProfile: { findUnique: vi.fn() },
    rankedHistory: { findFirst: vi.fn() },
    matchParticipant: { findMany: vi.fn(), findFirst: vi.fn() },
    championStat: { findMany: vi.fn() },
  },
}));

vi.mock("@/domains/riot/services/syncFreshness", () => ({
  requestSyncIfStale: vi.fn().mockResolvedValue({ requested: false }),
}));

import { prisma } from "@/lib/db/prisma";
import { requestSyncIfStale } from "@/domains/riot/services/syncFreshness";
import { getOverlayPayload } from "./overlayDataService";

const mockPrisma = prisma as unknown as {
  creatorProfile: { findUnique: ReturnType<typeof vi.fn> };
  rankedHistory: { findFirst: ReturnType<typeof vi.fn> };
  matchParticipant: { findMany: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> };
  championStat: { findMany: ReturnType<typeof vi.fn> };
};

const NOW = new Date("2026-08-18T14:00:00.000Z");
const GAME_NAME = "kaanproak0";
const TAG_LINE = "TR1";

function account(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "riot-1",
    region: "TR1",
    gameName: GAME_NAME,
    tagLine: TAG_LINE,
    isPrimary: true,
    ...overrides,
  };
}

function creatorRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "creator-1",
    userId: "user-1",
    riotAccountId: null,
    overlayKey: "aaaaaaaaaaaaaaaaaaaaaa",
    enabled: true,
    displayName: null,
    streamSafe: false,
    delaySeconds: 0,
    theme: "dark",
    accentColor: "#22d3ee",
    sessionStartedAt: new Date("2026-08-18T10:00:00.000Z"),
    goalTier: null,
    goalDivision: null,
    twitchHandle: null,
    kickHandle: null,
    youtubeHandle: null,
    user: {
      profile: { timezone: "Europe/Istanbul" },
      riotAccounts: [account()],
    },
    ...overrides,
  };
}

function setDefaults(): void {
  mockPrisma.rankedHistory.findFirst.mockResolvedValue({
    tier: "EMERALD",
    division: "II",
    lp: 45,
  });
  mockPrisma.matchParticipant.findMany.mockResolvedValue([]);
  mockPrisma.matchParticipant.findFirst.mockResolvedValue(null);
  mockPrisma.championStat.findMany.mockResolvedValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  setDefaults();
});

describe("getOverlayPayload — key resolution", () => {
  it("returns null for an unknown key", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(null);
    expect(await getOverlayPayload("nosuchkeynosuchkeynos", NOW)).toBeNull();
  });

  // Indistinguishable from unknown on purpose: the caller 404s both, so a probe
  // cannot learn that a key exists but is switched off.
  it("returns null for a disabled kit", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow({ enabled: false }));
    expect(await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW)).toBeNull();
  });

  it("returns null when the creator has no linked Riot account", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(
      creatorRow({ user: { profile: null, riotAccounts: [] } })
    );
    expect(await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW)).toBeNull();
  });

  it("falls back to the primary account when none was chosen", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(
      creatorRow({
        riotAccountId: null,
        user: {
          profile: null,
          riotAccounts: [
            account({ id: "riot-alt", isPrimary: false, gameName: "smurf" }),
            account({ id: "riot-main", isPrimary: true, gameName: "main" }),
          ],
        },
      })
    );

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.identity.name).toBe(`main#${TAG_LINE}`);
  });

  it("uses the chosen account when it is still linked", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(
      creatorRow({
        riotAccountId: "riot-alt",
        user: {
          profile: null,
          riotAccounts: [
            account({ id: "riot-alt", isPrimary: false, gameName: "smurf" }),
            account({ id: "riot-main", isPrimary: true, gameName: "main" }),
          ],
        },
      })
    );

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.identity.name).toBe(`smurf#${TAG_LINE}`);
  });

  // Unlinking the chosen account must not blank the overlay mid-stream.
  it("falls back to the primary when the chosen account is gone", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(
      creatorRow({
        riotAccountId: "riot-deleted",
        user: { profile: null, riotAccounts: [account({ id: "riot-main", gameName: "main" })] },
      })
    );

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.identity.name).toBe(`main#${TAG_LINE}`);
  });
});

describe("getOverlayPayload — the broadcast delay", () => {
  it("pulls every query bound back by the delay", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow({ delaySeconds: 120 }));

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);

    expect(result?.window.visibleUntil.toISOString()).toBe("2026-08-18T13:58:00.000Z");
    expect(result?.payload.asOf).toBe("2026-08-18T13:58:00.000Z");

    const sessionWhere = mockPrisma.matchParticipant.findMany.mock.calls[0]?.[0] as {
      where: { match: { gameEnd: { gte: Date; lte: Date } } };
    };
    expect(sessionWhere.where.match.gameEnd.lte.toISOString()).toBe("2026-08-18T13:58:00.000Z");

    const lastGameWhere = mockPrisma.matchParticipant.findFirst.mock.calls[0]?.[0] as {
      where: { match: { gameEnd: { lte: Date } } };
    };
    expect(lastGameWhere.where.match.gameEnd.lte.toISOString()).toBe("2026-08-18T13:58:00.000Z");
  });

  // The defect the delay exists to prevent, stated end to end: a game that ended
  // 30 seconds ago must not reach an overlay on a 2-minute broadcast delay,
  // because showing it tells a sniper the streamer just finished.
  it("excludes a game newer than the delay and reports the previous one", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow({ delaySeconds: 120 }));

    const game = (championName: string, gameEnd: string): Record<string, unknown> => ({
      championId: 103,
      championName,
      kills: 8,
      deaths: 2,
      assists: 11,
      csPerMinute: 7.4,
      won: true,
      match: { gameDuration: 1920, gameEnd: new Date(gameEnd), queueType: "RANKED_SOLO_5x5" },
    });

    const justFinished = game("Yasuo", "2026-08-18T13:59:30.000Z");
    const previous = game("Ahri", "2026-08-18T13:20:00.000Z");

    // Stands in for the database: returns the newest game the `lte` bound
    // actually allows, so a service that forgot the bound would hand back the
    // game that finished 30 seconds ago and fail this test.
    mockPrisma.matchParticipant.findFirst.mockImplementation(
      ({ where }: { where: { match: { gameEnd: { lte: Date } } } }) => {
        const bound = where.match.gameEnd.lte;
        const visible = [justFinished, previous].filter(
          (g) => (g.match as { gameEnd: Date }).gameEnd <= bound
        );
        return Promise.resolve(visible[0] ?? null);
      }
    );

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);

    expect(result?.payload.lastGame?.championName).toBe("Ahri");
    expect(result?.payload.lastGame?.endedAt).toBe("2026-08-18T13:20:00.000Z");
  });

  // The same mock with no delay must hand back the newer game, or the test above
  // would pass for a service that simply never returns anything recent.
  it("shows a game that just finished when there is no delay", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow({ delaySeconds: 0 }));

    const game = (championName: string, gameEnd: string): Record<string, unknown> => ({
      championId: 103,
      championName,
      kills: 8,
      deaths: 2,
      assists: 11,
      csPerMinute: 7.4,
      won: true,
      match: { gameDuration: 1920, gameEnd: new Date(gameEnd), queueType: "RANKED_SOLO_5x5" },
    });

    const justFinished = game("Yasuo", "2026-08-18T13:59:30.000Z");
    const previous = game("Ahri", "2026-08-18T13:20:00.000Z");

    mockPrisma.matchParticipant.findFirst.mockImplementation(
      ({ where }: { where: { match: { gameEnd: { lte: Date } } } }) => {
        const bound = where.match.gameEnd.lte;
        const visible = [justFinished, previous].filter(
          (g) => (g.match as { gameEnd: Date }).gameEnd <= bound
        );
        return Promise.resolve(visible[0] ?? null);
      }
    );

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);

    expect(result?.payload.lastGame?.championName).toBe("Yasuo");
  });

  it("uses now as the bound when there is no delay", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow({ delaySeconds: 0 }));

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.asOf).toBe(NOW.toISOString());
  });

  it("echoes the delay back so a widget can label itself", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow({ delaySeconds: 90 }));

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.delaySeconds).toBe(90);
  });
});

describe("getOverlayPayload — stream-safe mode", () => {
  it("carries the Riot ID when stream-safe is off", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow({ streamSafe: false }));

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.identity.name).toBe(`${GAME_NAME}#${TAG_LINE}`);
    expect(result?.payload.identity.redacted).toBe(false);
  });

  // The invariant asserted over the whole serialised payload, not one field —
  // a leak anywhere in it is a leak.
  it("emits the Riot ID nowhere in the payload when stream-safe is on", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow({ streamSafe: true }));
    mockPrisma.matchParticipant.findFirst.mockResolvedValue({
      championId: 103,
      championName: "Ahri",
      kills: 8,
      deaths: 2,
      assists: 11,
      csPerMinute: 7.4,
      won: true,
      match: {
        gameDuration: 1920,
        gameEnd: new Date("2026-08-18T13:20:00.000Z"),
        queueType: "RANKED_SOLO_5x5",
      },
    });

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    const serialised = JSON.stringify(result?.payload);

    expect(serialised).not.toContain(GAME_NAME);
    expect(serialised).not.toContain(`${GAME_NAME}#${TAG_LINE}`);
    expect(result?.payload.identity.redacted).toBe(true);
  });

  it("keeps a chosen display name under stream-safe", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(
      creatorRow({ streamSafe: true, displayName: "Kaan" })
    );

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.identity.name).toBe("Kaan");
    expect(JSON.stringify(result?.payload)).not.toContain(GAME_NAME);
  });
});

describe("getOverlayPayload — session figures", () => {
  const participants = [
    { kills: 8, deaths: 2, assists: 11, won: true },
    { kills: 3, deaths: 7, assists: 4, won: false },
    { kills: 12, deaths: 1, assists: 6, won: true },
  ];

  it("totals wins, losses and KDA over the session", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow());
    mockPrisma.matchParticipant.findMany.mockResolvedValue(participants);

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    const session = result?.payload.session;

    expect(session?.wins).toBe(2);
    expect(session?.losses).toBe(1);
    expect(session?.games).toBe(3);
    expect(session?.winRate).toBe(67);
    expect(session?.kills).toBe(23);
    expect(session?.deaths).toBe(10);
    expect(session?.assists).toBe(21);
    expect(session?.kda).toBe(4.4);
  });

  it("reports null rather than zero when no games have been played", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow());

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);

    expect(result?.payload.session.games).toBe(0);
    expect(result?.payload.session.winRate).toBeNull();
    expect(result?.payload.session.kda).toBeNull();
  });

  // A deathless session must not divide by zero.
  it("floors deaths at one for a perfect session", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow());
    mockPrisma.matchParticipant.findMany.mockResolvedValue([
      { kills: 5, deaths: 0, assists: 5, won: true },
    ]);

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.session.kda).toBe(10);
  });

  it("starts the session at local midnight when none was set", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(
      creatorRow({ sessionStartedAt: null })
    );

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    // Istanbul is UTC+3, so today began at 21:00 UTC yesterday.
    expect(result?.payload.session.startedAt).toBe("2026-08-17T21:00:00.000Z");
  });
});

describe("getOverlayPayload — rank and goal", () => {
  it("reports the LP gained since the session started", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow());
    mockPrisma.rankedHistory.findFirst
      .mockResolvedValueOnce({ tier: "EMERALD", division: "II", lp: 45 }) // now
      .mockResolvedValueOnce({ tier: "EMERALD", division: "III", lp: 81 }) // at start
      .mockResolvedValueOnce({ tier: "EMERALD", division: "III", lp: 81 }); // goal baseline

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);

    expect(result?.payload.rank?.label).toBe("Emerald II");
    expect(result?.payload.rank?.sessionLpDelta).toBe(64);
  });

  it("reports no delta when there is no snapshot from before the session", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow());
    mockPrisma.rankedHistory.findFirst
      .mockResolvedValueOnce({ tier: "EMERALD", division: "II", lp: 45 })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.rank?.sessionLpDelta).toBeNull();
  });

  it("reports no rank at all before the first ranked snapshot", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow());
    mockPrisma.rankedHistory.findFirst.mockResolvedValue(null);

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.rank).toBeNull();
    expect(result?.payload.goal).toBeNull();
  });

  it("returns no goal when the creator set none", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow());
    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.goal).toBeNull();
  });

  it("measures the goal in LP still to gain", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(
      creatorRow({ goalTier: "DIAMOND", goalDivision: "IV" })
    );
    mockPrisma.rankedHistory.findFirst.mockResolvedValue({
      tier: "EMERALD",
      division: "II",
      lp: 45,
    });

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);

    // Emerald II 45 LP to Diamond IV 0 LP: two divisions minus the 45 already held.
    expect(result?.payload.goal?.label).toBe("Diamond IV");
    expect(result?.payload.goal?.lpRemaining).toBe(155);
  });
});

describe("getOverlayPayload — champions", () => {
  it("maps champion stats with a rounded win rate", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow());
    mockPrisma.championStat.findMany.mockResolvedValue([
      { championId: 103, gamesPlayed: 30, wins: 17, avgKda: 3.42, champion: { name: "Ahri" } },
    ]);

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);

    expect(result?.payload.champions).toEqual([
      { championId: 103, championName: "Ahri", games: 30, wins: 17, winRate: 57, kda: 3.42 },
    ]);
  });
});

describe("getOverlayPayload — freshness", () => {
  // The overlay is the only surface where nobody is looking at our site, so the
  // poll itself has to ask for the sync.
  it("asks for a sync for the account it read", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow());

    await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);

    expect(requestSyncIfStale).toHaveBeenCalledWith("riot-1", "user-1", NOW);
  });

  it("still answers when the sync request fails", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(creatorRow());
    vi.mocked(requestSyncIfStale).mockRejectedValueOnce(new Error("Inngest down"));

    const result = await getOverlayPayload("aaaaaaaaaaaaaaaaaaaaaa", NOW);
    expect(result?.payload.session).toBeDefined();
  });
});
