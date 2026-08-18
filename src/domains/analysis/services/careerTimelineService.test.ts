import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    riotAccount: { findUnique: vi.fn() },
    matchParticipant: { findMany: vi.fn() },
    championStat: { findMany: vi.fn() },
  },
}));
vi.mock("./careerSourceEvents", () => ({
  buildRankHistory: vi.fn(),
  buildAchievementEvents: vi.fn(),
  buildHabitEvents: vi.fn(),
  buildAcademyEvents: vi.fn(),
  buildSeasonEvents: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import {
  buildAcademyEvents,
  buildAchievementEvents,
  buildHabitEvents,
  buildRankHistory,
  buildSeasonEvents,
} from "./careerSourceEvents";
import { getCareerTimeline } from "./careerTimelineService";

const USER_ID = "8f1c1b2e-0000-4000-8000-0000000000aa";
const ACCOUNT_ID = "8f1c1b2e-0000-4000-8000-0000000000bb";

/** Recent enough to sit inside the two-year window whatever day the suite runs. */
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

function participant(gameStart: Date, won: boolean, championName = "Ahri") {
  return {
    championId: 103,
    championName,
    kills: 5,
    deaths: 2,
    assists: 6,
    cs: 190,
    csPerMinute: 6.2,
    visionScore: 24,
    won,
    match: {
      matchId: `TR1_${gameStart.getTime()}`,
      gameStart,
      gameDuration: 1800,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue({
    puuid: "puuid-1",
    gameName: "kaanproak0",
    tagLine: "TR1",
    summonerLevel: 148,
    createdAt: daysAgo(40),
  } as never);
  vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.championStat.findMany).mockResolvedValue([] as never);
  vi.mocked(buildRankHistory).mockResolvedValue({
    events: [],
    lpSeries: [],
    byMonth: new Map(),
  });
  vi.mocked(buildAchievementEvents).mockResolvedValue([]);
  vi.mocked(buildHabitEvents).mockResolvedValue([]);
  vi.mocked(buildAcademyEvents).mockResolvedValue([]);
  vi.mocked(buildSeasonEvents).mockResolvedValue([]);
});

describe("getCareerTimeline", () => {
  it("refuses an account that does not exist", async () => {
    vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue(null as never);
    await expect(getCareerTimeline(USER_ID, ACCOUNT_ID)).rejects.toThrow();
  });

  it("survives a player with no games at all", async () => {
    const timeline = await getCareerTimeline(USER_ID, ACCOUNT_ID);

    expect(timeline.summary.totalGames).toBe(0);
    expect(timeline.summary.firstTrackedAt).toBeNull();
    expect(timeline.summary.currentRank).toBeNull();
    // The link event is still a band of its own — the account exists even if it never queued.
    expect(timeline.bands.some((b) => b.events.some((e) => e.kind === "joined"))).toBe(true);
  });

  it("counts games and hours across the window", async () => {
    // Held in a variable rather than recomputed: daysAgo() reads the clock, so calling
    // it twice gives two timestamps milliseconds apart.
    const oldest = daysAgo(30);
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
      participant(oldest, true),
      participant(daysAgo(20), false),
      participant(daysAgo(10), true),
    ] as never);

    const timeline = await getCareerTimeline(USER_ID, ACCOUNT_ID);

    expect(timeline.summary.totalGames).toBe(3);
    // 3 × 1800s = 1.5h, rounded.
    expect(timeline.summary.totalHours).toBe(2);
    expect(timeline.summary.firstTrackedAt).toBe(oldest.toISOString());
  });

  it("does not claim to know when the player started playing", async () => {
    const timeline = await getCareerTimeline(USER_ID, ACCOUNT_ID);
    const joined = timeline.bands.flatMap((b) => b.events).find((e) => e.kind === "joined");

    expect(joined?.title).toBe("Tracking started here");
  });

  it("folds each month's rank onto its band", async () => {
    const month = daysAgo(15).toISOString().slice(0, 7);
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
      participant(daysAgo(15), true),
    ] as never);
    vi.mocked(buildRankHistory).mockResolvedValue({
      events: [],
      lpSeries: [{ at: daysAgo(15).toISOString(), value: 1_240, label: "Silver II" }],
      byMonth: new Map([[month, { lpDelta: 64, rankAtClose: "Silver II" }]]),
    });

    const timeline = await getCareerTimeline(USER_ID, ACCOUNT_ID);
    const band = timeline.bands.find((b) => b.key === month);

    expect(band?.lpDelta).toBe(64);
    expect(band?.rankAtClose).toBe("Silver II");
  });

  it("reads peak from the highest point on the line, not the latest", async () => {
    vi.mocked(buildRankHistory).mockResolvedValue({
      events: [],
      lpSeries: [
        { at: daysAgo(30).toISOString(), value: 1_100, label: "Silver IV" },
        { at: daysAgo(20).toISOString(), value: 1_400, label: "Silver I" },
        { at: daysAgo(10).toISOString(), value: 1_240, label: "Silver II" },
      ],
      byMonth: new Map(),
    });

    const timeline = await getCareerTimeline(USER_ID, ACCOUNT_ID);

    expect(timeline.summary.peakRank).toBe("Silver I");
    expect(timeline.summary.currentRank).toBe("Silver II");
  });

  it("turns BigInt mastery points into something that can be serialised", async () => {
    vi.mocked(prisma.championStat.findMany).mockResolvedValue([
      {
        championId: 157,
        masteryLevel: 7,
        masteryPoints: BigInt(482_310),
        champion: { name: "Yasuo" },
      },
    ] as never);

    const timeline = await getCareerTimeline(USER_ID, ACCOUNT_ID);

    expect(timeline.summary.topMastery[0]).toEqual({
      championId: 157,
      championName: "Yasuo",
      level: 7,
      points: 482_310,
    });
    expect(() => JSON.stringify(timeline)).not.toThrow();
  });

  it("gathers events from every source onto the spine", async () => {
    const at = daysAgo(12).toISOString();
    const stub = (id: string, kind: string) => ({
      id,
      kind,
      group: "learning",
      at,
      title: id,
      detail: null,
      tone: "neutral",
      weight: 10,
      href: null,
    });
    vi.mocked(buildAchievementEvents).mockResolvedValue([stub("a", "achievement")] as never);
    vi.mocked(buildHabitEvents).mockResolvedValue([stub("h", "habit")] as never);
    vi.mocked(buildAcademyEvents).mockResolvedValue([stub("l", "academy")] as never);
    vi.mocked(buildSeasonEvents).mockResolvedValue([stub("s", "season")] as never);

    const timeline = await getCareerTimeline(USER_ID, ACCOUNT_ID);
    const ids = timeline.bands.flatMap((b) => b.events).map((e) => e.id);

    expect(ids).toEqual(expect.arrayContaining(["a", "h", "l", "s"]));
  });
});
