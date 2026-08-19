import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    matchParticipant: { findMany: vi.fn(), aggregate: vi.fn(), count: vi.fn() },
    match: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from "@/lib/db/prisma";
import { archiveFilterSchema } from "@/domains/match/services/matchArchiveFilters";
import {
  archiveFacetOptions,
  archiveTotals,
  searchArchive,
} from "@/domains/match/services/matchArchiveService";

const db = prisma as unknown as {
  matchParticipant: { findMany: ReturnType<typeof vi.fn>; aggregate: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  match: { findMany: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
};

const PUUID = "puuid-me";
const F = (o: Record<string, unknown> = {}) => archiveFilterSchema.parse(o);

/** A participant row in the shape the service's `select` produces. */
function row(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    championName: "Ahri",
    championId: 103,
    position: "MIDDLE",
    won: true,
    kills: 8,
    deaths: 2,
    assists: 6,
    cs: 200,
    csPerMinute: "7.10",
    visionScore: 24,
    goldEarned: 12000,
    damageDealt: 25000,
    itemIds: [1001],
    match: {
      id: `m-${id}`,
      matchId: `TR1_${id}`,
      gameStart: new Date("2026-08-01T12:00:00Z"),
      gameDuration: 1800,
      queueType: "RANKED_SOLO_5x5",
      gameVersion: "15.14.1",
    },
    ...overrides,
  };
}

function stubTotals(games = 0, wins = 0) {
  db.matchParticipant.aggregate.mockResolvedValue({
    _count: { _all: games },
    _sum: { kills: 0, deaths: 0, assists: 0 },
    _avg: { kills: 0, deaths: 0, assists: 0, csPerMinute: 0, visionScore: 0 },
  });
  db.matchParticipant.count.mockResolvedValue(wins);
}

beforeEach(() => {
  vi.clearAllMocks();
  stubTotals();
});

describe("searchArchive — pagination", () => {
  it("asks for one more row than the page, and hides it", async () => {
    db.matchParticipant.findMany.mockResolvedValue([row("a"), row("b"), row("c")]);

    const page = await searchArchive(PUUID, F(), undefined, 2);

    expect(db.matchParticipant.findMany.mock.calls[0][0].take).toBe(3);
    expect(page.rows.map((r) => r.participantId)).toEqual(["a", "b"]);
    expect(page.nextCursor).toBe("b");
  });

  it("reports no next cursor when the page is not full", async () => {
    db.matchParticipant.findMany.mockResolvedValue([row("a")]);
    const page = await searchArchive(PUUID, F(), undefined, 2);
    expect(page.rows).toHaveLength(1);
    expect(page.nextCursor).toBeNull();
  });

  it("skips the cursor row itself so pages do not overlap", async () => {
    db.matchParticipant.findMany.mockResolvedValue([]);
    await searchArchive(PUUID, F(), "cursor-id", 5);

    const args = db.matchParticipant.findMany.mock.calls[0][0];
    expect(args.cursor).toEqual({ id: "cursor-id" });
    expect(args.skip).toBe(1);
  });

  it("orders by game time with an id tiebreaker, so the cursor is a total order", async () => {
    db.matchParticipant.findMany.mockResolvedValue([]);
    await searchArchive(PUUID, F());

    expect(db.matchParticipant.findMany.mock.calls[0][0].orderBy).toEqual([
      { match: { gameStart: "desc" } },
      { id: "desc" },
    ]);
  });

  it("caps an absurd page size rather than letting a caller read the whole archive at once", async () => {
    db.matchParticipant.findMany.mockResolvedValue([]);
    await searchArchive(PUUID, F(), undefined, 100_000);
    expect(db.matchParticipant.findMany.mock.calls[0][0].take).toBe(101);
  });
});

describe("searchArchive — totals are computed once per search", () => {
  // The totals cover the whole filtered set rather than the page, so they cannot change while
  // paging. Recomputing them per page bought two extra full-set aggregate scans per request and
  // got the same answer back every time.
  it("computes totals on the first page", async () => {
    db.matchParticipant.findMany.mockResolvedValue([row("a")]);
    const page = await searchArchive(PUUID, F(), undefined, 2);

    expect(page.totals).not.toBeNull();
    expect(db.matchParticipant.aggregate).toHaveBeenCalledTimes(1);
    expect(db.matchParticipant.count).toHaveBeenCalledTimes(1);
  });

  it("does not recompute them on a continuation page", async () => {
    db.matchParticipant.findMany.mockResolvedValue([row("a")]);
    const page = await searchArchive(PUUID, F(), "cursor-id", 2);

    expect(page.totals).toBeNull();
    expect(db.matchParticipant.aggregate).not.toHaveBeenCalled();
    expect(db.matchParticipant.count).not.toHaveBeenCalled();
  });

  it("still returns the page itself on a continuation page", async () => {
    db.matchParticipant.findMany.mockResolvedValue([row("a"), row("b")]);
    const page = await searchArchive(PUUID, F(), "cursor-id", 2);

    expect(page.rows).toHaveLength(2);
  });
});

describe("searchArchive — facet resolution", () => {
  it("does not touch the raw KDA query unless a KDA threshold is set", async () => {
    db.matchParticipant.findMany.mockResolvedValue([]);
    await searchArchive(PUUID, F({ result: "win" }));
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });

  it("narrows to the ids Postgres computed for a KDA threshold", async () => {
    db.$queryRaw.mockResolvedValue([{ id: "p1" }, { id: "p2" }]);
    db.matchParticipant.findMany.mockResolvedValue([]);

    await searchArchive(PUUID, F({ minKda: 3 }));

    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    expect(db.matchParticipant.findMany.mock.calls[0][0].where.AND).toEqual([
      { id: { in: ["p1", "p2"] } },
    ]);
  });

  it("resolves a co-player only from games we were also in", async () => {
    db.matchParticipant.findMany
      .mockResolvedValueOnce([{ matchId: "m1", teamId: 100 }]) // the co-player resolution
      .mockResolvedValueOnce([]); // the page itself

    await searchArchive(PUUID, F({ playerPuuid: "them", playerSide: "with" }));

    expect(db.matchParticipant.findMany.mock.calls[0][0].where).toEqual({
      puuid: "them",
      match: { participants: { some: { puuid: PUUID } } },
    });
  });
});

describe("archiveTotals", () => {
  it("describes the whole filtered set, not the page", async () => {
    db.matchParticipant.aggregate.mockResolvedValue({
      _count: { _all: 100 },
      _sum: { kills: 500, deaths: 300, assists: 328 },
      _avg: { kills: 5, deaths: 3, assists: 3.28, csPerMinute: 6.5, visionScore: 22 },
    });
    db.matchParticipant.count.mockResolvedValue(56);

    const totals = await archiveTotals({ puuid: PUUID });

    expect(totals.games).toBe(100);
    expect(totals.wins).toBe(56);
    expect(totals.losses).toBe(44);
    expect(totals.winRate).toBeCloseTo(56);
    // Ratio of sums: (500 + 328) / 300.
    expect(totals.avgKda).toBeCloseTo(2.76, 2);
  });

  it("counts wins under the same filter rather than across the archive", async () => {
    db.matchParticipant.aggregate.mockResolvedValue({
      _count: { _all: 10 },
      _sum: { kills: 0, deaths: 0, assists: 0 },
      _avg: { kills: 0, deaths: 0, assists: 0, csPerMinute: 0, visionScore: 0 },
    });
    db.matchParticipant.count.mockResolvedValue(4);

    const where = { puuid: PUUID, championName: { in: ["Ahri"] } };
    await archiveTotals(where);

    expect(db.matchParticipant.count).toHaveBeenCalledWith({
      where: { AND: [where, { won: true }] },
    });
  });

  it("returns zeroes rather than dividing by nothing on an empty set", async () => {
    const totals = await archiveTotals({ puuid: PUUID });
    expect(totals).toMatchObject({ games: 0, winRate: 0, avgKda: 0 });
  });
});

describe("archiveFacetOptions", () => {
  it("offers only what the player actually has, patches grouped to major.minor", async () => {
    db.matchParticipant.findMany.mockResolvedValue([
      { championName: "Zed" },
      { championName: "Ahri" },
    ]);
    db.match.findMany.mockResolvedValue([
      { gameVersion: "15.14.1", queueType: "RANKED_SOLO_5x5" },
      { gameVersion: "15.14.582", queueType: "RANKED_SOLO_5x5" },
      { gameVersion: "15.13.9", queueType: "ARAM" },
    ]);

    const opts = await archiveFacetOptions(PUUID);

    expect(opts.champions).toEqual(["Ahri", "Zed"]);
    // "15.14.1" and "15.14.582" are one patch to a player.
    expect(opts.patches).toEqual(["15.14", "15.13"]);
    expect(opts.queueTypes).toEqual(["ARAM", "RANKED_SOLO_5x5"]);
  });
});
