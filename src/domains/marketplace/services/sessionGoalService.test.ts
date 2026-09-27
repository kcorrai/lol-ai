import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    booking: { findFirst: vi.fn() },
    sessionGoal: { deleteMany: vi.fn(), upsert: vi.fn() },
    matchParticipant: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/db/prisma";
import { goalProgress, setGoals } from "@/domains/marketplace/services/sessionGoalService";

const db = vi.mocked(prisma, true);
const SET_AT = new Date("2026-09-20T12:00:00Z");

function game(over: Record<string, unknown> = {}) {
  return {
    championName: "Ahri",
    gameStart: new Date("2026-09-21T18:00:00Z"),
    kills: 5,
    deaths: 2,
    assists: 5,
    csPerMinute: 7.5,
    visionScore: 20,
    match: { matchId: "EUW1_1", gameDuration: 1800 },
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockResolvedValue([] as never);
});

describe("setGoals", () => {
  it("only lets the booking's coach set goals", async () => {
    db.booking.findFirst.mockResolvedValue(null as never);

    expect(await setGoals("b-1", "someone", [])).toEqual({ ok: false, reason: "not-found" });
    expect(db.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "b-1", coachProfile: { userId: "someone" } } })
    );
  });

  it("waits until the session is agreed", async () => {
    db.booking.findFirst.mockResolvedValue({ id: "b-1", status: "PENDING_COACH" } as never);

    const result = await setGoals("b-1", "coach", [{ metric: "KDA", target: 3 }]);
    expect(result).toEqual({ ok: false, reason: "not-open" });
  });

  it.each([
    [
      "more than three",
      [
        { metric: "KDA", target: 3 },
        { metric: "DEATHS", target: 4 },
        { metric: "CS_PER_MIN", target: 7 },
        { metric: "VISION_PER_MIN", target: 1 },
      ],
    ],
    [
      "the same metric twice",
      [
        { metric: "KDA", target: 3 },
        { metric: "KDA", target: 4 },
      ],
    ],
    ["a target out of range", [{ metric: "CS_PER_MIN", target: 40 }]],
  ])("refuses %s", async (_label, goals) => {
    db.booking.findFirst.mockResolvedValue({ id: "b-1", status: "DELIVERED" } as never);

    expect(await setGoals("b-1", "coach", goals as never)).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("keeps an adjusted goal's start date by upserting, and drops the rest", async () => {
    db.booking.findFirst.mockResolvedValue({ id: "b-1", status: "DELIVERED" } as never);

    expect(await setGoals("b-1", "coach", [{ metric: "DEATHS", target: 4 }])).toEqual({ ok: true });
    expect(db.sessionGoal.deleteMany).toHaveBeenCalledWith({
      where: { bookingId: "b-1", metric: { notIn: ["DEATHS"] } },
    });
    expect(db.sessionGoal.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { target: 4 } })
    );
  });
});

describe("goalProgress", () => {
  it("is null for someone on neither side of the booking", async () => {
    db.booking.findFirst.mockResolvedValue(null as never);
    expect(await goalProgress("b-1", "stranger")).toBeNull();
  });

  it("reports untracked goals when no Riot account was attached", async () => {
    db.booking.findFirst.mockResolvedValue({
      riotAccount: null,
      goals: [{ metric: "KDA", target: 3, createdAt: SET_AT }],
    } as never);

    const progress = await goalProgress("b-1", "student");

    expect(progress?.tracked).toBe(false);
    expect(progress?.goals[0]).toMatchObject({ metric: "KDA", hits: 0 });
    expect(db.matchParticipant.findMany).not.toHaveBeenCalled();
  });

  it("counts the ranked games after the goal was set", async () => {
    db.booking.findFirst.mockResolvedValue({
      riotAccount: { puuid: "p-1" },
      goals: [
        { metric: "CS_PER_MIN", target: 7, createdAt: SET_AT },
        { metric: "DEATHS", target: 3, createdAt: SET_AT },
      ],
    } as never);
    db.matchParticipant.findMany.mockResolvedValue([
      game(),
      game({ deaths: 6, csPerMinute: 6, match: { matchId: "EUW1_2", gameDuration: 1500 } }),
    ] as never);

    const progress = await goalProgress("b-1", "student");

    expect(db.matchParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          puuid: "p-1",
          queueType: { in: ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"] },
          gameStart: { gt: SET_AT },
        },
        orderBy: { gameStart: "asc" },
      })
    );
    expect(progress?.goals.map((g) => [g.metric, g.hits])).toEqual([
      ["CS_PER_MIN", 1],
      ["DEATHS", 1],
    ]);
    expect(progress?.games[1].results.DEATHS).toEqual({ value: 6, met: false });
  });

  it("does not hold a later goal to games played before it was set", async () => {
    db.booking.findFirst.mockResolvedValue({
      riotAccount: { puuid: "p-1" },
      goals: [
        { metric: "KDA", target: 3, createdAt: SET_AT },
        { metric: "DEATHS", target: 3, createdAt: new Date("2026-09-22T00:00:00Z") },
      ],
    } as never);
    db.matchParticipant.findMany.mockResolvedValue([game()] as never);

    const progress = await goalProgress("b-1", "student");

    expect(progress?.games[0].results.KDA).toBeDefined();
    expect(progress?.games[0].results.DEATHS).toBeUndefined();
  });
});
