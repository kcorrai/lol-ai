import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    riotAccount: { findMany: vi.fn() },
    matchParticipant: { findMany: vi.fn() },
    matchTimelineFrame: { findMany: vi.fn() },
    matchTimelineEvent: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { getMatchStoryForUser } from "@/domains/match/services/matchStoryService";
import { STORY_EVENT_KINDS } from "@/domains/match/types/matchStory.types";
import { parseFrames, participantPuuids } from "@/domains/riot/timeline/parseFrames";
import { parseEvents } from "@/domains/riot/timeline/parseEvents";
import { PUUIDS, timelineFixture } from "@/domains/riot/timeline/timeline.fixture";

/**
 * Prisma's mocked methods are typed to their whole model, while these fixtures are the narrow
 * `select` shape the service actually asks for. Cast through this rather than widening the
 * service's own types to suit the test — and without `any`, which CLAUDE.md forbids outright.
 */
function selected<T>(value: T): never {
  return value as unknown as never;
}

const MATCH = "match-db-id";
const USER = "user-id";
const ME = PUUIDS[1]; // blue top

const ROSTER = [
  {
    puuid: PUUIDS[1],
    championName: "Ornn",
    teamId: 100,
    position: "TOP",
    gameName: "Me",
    tagLine: "NA1",
  },
  {
    puuid: PUUIDS[2],
    championName: "LeeSin",
    teamId: 100,
    position: "JUNGLE",
    gameName: "Jg",
    tagLine: "NA1",
  },
  {
    puuid: PUUIDS[3],
    championName: "Ahri",
    teamId: 100,
    position: "MIDDLE",
    gameName: "Mid",
    tagLine: "NA1",
  },
  {
    puuid: PUUIDS[6],
    championName: "Darius",
    teamId: 200,
    position: "TOP",
    gameName: "Rival",
    tagLine: "NA1",
  },
  {
    puuid: PUUIDS[7],
    championName: "Vi",
    teamId: 200,
    position: "JUNGLE",
    gameName: "RivalJg",
    tagLine: "NA1",
  },
];

/** Frame rows in the shape the service's `select` produces, built from the shared riot fixture. */
function frameRows() {
  return parseFrames(MATCH, timelineFixture()).map((r) => ({
    puuid: r.puuid,
    minute: r.minute,
    totalGold: r.totalGold,
    level: r.level,
    minionsKilled: r.minionsKilled,
    jungleMinionsKilled: r.jungleMinionsKilled,
  }));
}

/** Event rows in the shape the service's `select` produces — filtered to the kinds the service's
 * own query filters to, since a mock does not honour the real `where` clause. */
function eventRows() {
  const timeline = timelineFixture();
  const storyKinds: readonly string[] = STORY_EVENT_KINDS;
  return parseEvents(MATCH, timeline, participantPuuids(timeline))
    .filter((r) => storyKinds.includes(r.kind))
    .map((r) => ({
      kind: r.kind,
      timestampMs: r.timestampMs,
      puuid: r.puuid,
      positionX: r.positionX,
      positionY: r.positionY,
      payload: r.payload,
    }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getMatchStoryForUser", () => {
  it("returns null for a user with no linked riot accounts", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(selected([]));
    expect(await getMatchStoryForUser(MATCH, USER)).toBeNull();
  });

  it("returns null for a match that does not exist", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(selected([{ puuid: ME }]));
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(selected([]));
    expect(await getMatchStoryForUser(MATCH, USER)).toBeNull();
  });

  it("returns null for a match the caller did not play in", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(
      selected([{ puuid: "someone-elses-puuid" }])
    );
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(selected(ROSTER));
    expect(await getMatchStoryForUser(MATCH, USER)).toBeNull();
  });

  it("matches by puuid across every linked account, not the first one", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(
      selected([{ puuid: "unrelated-account" }, { puuid: ME }])
    );
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(selected(ROSTER));
    vi.mocked(prisma.matchTimelineFrame.findMany).mockResolvedValue(selected([]));

    expect(await getMatchStoryForUser(MATCH, USER)).not.toBeNull();
  });

  it("answers hasTimeline: false for an owned match that predates capture, not null", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(selected([{ puuid: ME }]));
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(selected(ROSTER));
    vi.mocked(prisma.matchTimelineFrame.findMany).mockResolvedValue(selected([]));

    // A match the caller owns is a resource that exists — an empty timeline must not read as
    // "not found" the way a stranger's match does.
    expect(await getMatchStoryForUser(MATCH, USER)).toEqual({ hasTimeline: false });
    expect(prisma.matchTimelineEvent.findMany).not.toHaveBeenCalled();
  });

  it("filters the event query to the story kinds instead of fetching all eleven", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(selected([{ puuid: ME }]));
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(selected(ROSTER));
    vi.mocked(prisma.matchTimelineFrame.findMany).mockResolvedValue(selected(frameRows()));
    vi.mocked(prisma.matchTimelineEvent.findMany).mockResolvedValue(selected([]));

    await getMatchStoryForUser(MATCH, USER);

    expect(prisma.matchTimelineEvent.findMany).toHaveBeenCalledTimes(1);
    const call = vi.mocked(prisma.matchTimelineEvent.findMany).mock.calls[0][0];
    expect(call?.where).toMatchObject({ matchId: MATCH, kind: { in: STORY_EVENT_KINDS } });
  });

  it("builds the roster, per-minute frames, and team gold difference for an owned, captured match", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(selected([{ puuid: ME }]));
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(selected(ROSTER));
    vi.mocked(prisma.matchTimelineFrame.findMany).mockResolvedValue(selected(frameRows()));
    vi.mocked(prisma.matchTimelineEvent.findMany).mockResolvedValue(selected(eventRows()));

    const result = await getMatchStoryForUser(MATCH, USER);
    if (!result || !result.hasTimeline) throw new Error("expected a captured story");

    expect(result.participants).toHaveLength(5);

    const minute3 = result.frames.find((f) => f.minute === 3);
    expect(minute3?.players).toHaveLength(5);

    // Three blue (100) participants at 500 + 3*400 each, two red (200) at 500 + 3*300 each — the
    // same figures timeline.fixture.ts's own comment documents as the testable sign.
    const blueTotal = (500 + 3 * 400) * 3;
    const redTotal = (500 + 3 * 300) * 2;
    expect(minute3?.teamTotals).toEqual(
      expect.arrayContaining([
        { teamId: 100, totalGold: blueTotal },
        { teamId: 200, totalGold: redTotal },
      ])
    );
    expect(minute3?.teamGoldDiff).toBe(blueTotal - redTotal);

    // CHAMPION_KILL, WARD_PLACED, WARD_KILL, ELITE_MONSTER_KILL, BUILDING_KILL survive;
    // ITEM_PURCHASED and SKILL_LEVEL_UP (also in the fixture) do not reach the response at all.
    expect(result.events.map((e) => e.kind).sort()).toEqual(
      ["BUILDING_KILL", "CHAMPION_KILL", "ELITE_MONSTER_KILL", "WARD_KILL", "WARD_PLACED"].sort()
    );

    const kill = result.events.find((e) => e.kind === "CHAMPION_KILL");
    expect(kill?.actor?.puuid).toBe(PUUIDS[1]); // the victim, per parseEvents' subject rule
    expect(kill?.payload).toMatchObject({ killerPuuid: PUUIDS[7], bounty: 300 });
  });
});
