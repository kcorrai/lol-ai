import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    academyAssignment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    academyProgress: { updateMany: vi.fn() },
    matchParticipant: { findMany: vi.fn() },
  },
}));

vi.mock("@/domains/riot", () => ({ listAccounts: vi.fn(), getAccountPuuid: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid, listAccounts } from "@/domains/riot";
import { checkAssignments, openAssignment, restartAssignment } from "./assignmentService";

const USER = "user-1";
const ACCOUNT = "acc-1";
const PUUID = "puuid-1";
// Foundations lesson 2 — a csPerMinute assignment: +0.5 over 3 games.
const LESSON = "foundations/minions-and-gold";

function assignmentRow(over: Record<string, unknown> = {}) {
  return {
    id: "asg-1",
    userId: USER,
    lessonId: LESSON,
    metric: "csPerMinute",
    direction: "increase",
    baseline: 5.1,
    target: 5.6,
    gamesRequired: 3,
    gamesObserved: 0,
    position: "MIDDLE",
    status: "active",
    evidence: null,
    // Two days ago in real time — the expiry window is judged against `new Date()`, so a
    // fixed date would start passing and then expiring as the calendar moves.
    startedAt: new Date(Date.now() - 2 * 86_400_000),
    resolvedAt: null,
    ...over,
  };
}

/** Sets the ranked games `loadReadings` will see — used for both baselines and verdicts. */
function withMatchRows(...cs: number[]): void {
  vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(cs.map(matchRow) as never);
}

/** A synced ranked game with the given CS/min, shaped like the select in loadReadings. */
function matchRow(csPerMinute: number, i: number) {
  return {
    kills: 3,
    deaths: 2,
    assists: 4,
    csPerMinute,
    visionScore: 20,
    teamId: 100,
    position: "MIDDLE",
    match: {
      id: `match-${i}`,
      gameStart: new Date(`2026-08-0${i + 2}T00:00:00Z`),
      participants: [{ teamId: 100, kills: 3 }],
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listAccounts).mockResolvedValue([{ id: ACCOUNT, isPrimary: true }] as never);
  vi.mocked(getAccountPuuid).mockResolvedValue(PUUID);
  vi.mocked(prisma.academyAssignment.findFirst).mockResolvedValue(null as never);
  // Baseline sample: five ranked games averaging 5.1 CS/min.
  withMatchRows(4.9, 5.0, 5.1, 5.2, 5.3);
  vi.mocked(prisma.academyAssignment.create).mockImplementation(
    (async ({ data }: { data: Record<string, unknown> }) =>
      assignmentRow(data)) as never
  );
});

describe("openAssignment", () => {
  it("creates an assignment pinned to the player's own baseline", async () => {
    const view = await openAssignment(USER, LESSON);

    expect(prisma.academyAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER,
        lessonId: LESSON,
        metric: "csPerMinute",
        direction: "increase",
        baseline: 5.1,
        target: 5.6,
        gamesRequired: 3,
      }),
    });
    expect(view).toMatchObject({ baseline: 5.1, target: 5.6, status: "active" });
  });

  // Re-reading a finished lesson must not restart the clock.
  it("returns the existing assignment instead of opening a second one", async () => {
    vi.mocked(prisma.academyAssignment.findFirst).mockResolvedValue(assignmentRow() as never);

    const view = await openAssignment(USER, LESSON);

    expect(prisma.academyAssignment.create).not.toHaveBeenCalled();
    expect(view?.status).toBe("active");
  });

  it("is a silent no-op with no linked Riot account", async () => {
    vi.mocked(listAccounts).mockResolvedValue([] as never);

    expect(await openAssignment(USER, LESSON)).toBeNull();
    expect(prisma.academyAssignment.create).not.toHaveBeenCalled();
  });

  // A target guessed from one or two games is worse than no target at all, and the lesson
  // still has to complete for a player we cannot measure.
  it("is a silent no-op with too few ranked games to set an honest baseline", async () => {
    withMatchRows(5.0, 5.0);

    expect(await openAssignment(USER, LESSON)).toBeNull();
    expect(prisma.academyAssignment.create).not.toHaveBeenCalled();
  });

  // The whole point of LA-22's baseline fix: the target is set on the same population the
  // verdict is read from — ranked only, and in one role.
  it("measures the baseline over ranked queues in the player's main role", async () => {
    await openAssignment(USER, LESSON);

    const calls = vi.mocked(prisma.matchParticipant.findMany).mock.calls as unknown as {
      where: { position?: string; match: { queueType: { in: string[] }; gameStart?: unknown } };
    }[][];
    const baselineCall = calls[calls.length - 1][0];

    expect(baselineCall.where.match.queueType.in).toEqual(["RANKED_SOLO_5x5", "RANKED_FLEX_SR"]);
    expect(baselineCall.where.position).toBe("MIDDLE");
    expect(baselineCall.where.match.gameStart).toBeUndefined();
  });

  it("pins the assignment to the role the baseline was measured in", async () => {
    await openAssignment(USER, LESSON);

    expect(prisma.academyAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ position: "MIDDLE" }),
    });
  });

  it("ignores a lesson id that does not resolve", async () => {
    expect(await openAssignment(USER, "ghost/lesson")).toBeNull();
    expect(prisma.academyAssignment.create).not.toHaveBeenCalled();
  });
});

describe("restartAssignment", () => {
  it("clears the resolved row and re-measures the baseline from today", async () => {
    withMatchRows(5.7, 5.8, 5.9);

    const view = await restartAssignment(USER, LESSON);

    expect(prisma.academyAssignment.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER, lessonId: LESSON, status: { in: ["failed", "expired"] } },
    });
    expect(view).toMatchObject({ baseline: 5.8, target: 6.3 });
  });
});

describe("checkAssignments", () => {
  function withOpen(rows: ReturnType<typeof assignmentRow>[]) {
    vi.mocked(prisma.academyAssignment.findMany).mockResolvedValue(rows as never);
  }
  const withMatches = withMatchRows;

  it("does nothing when there is nothing open", async () => {
    withOpen([]);

    expect(await checkAssignments(USER, ACCOUNT)).toEqual({
      checked: 0,
      passed: [],
      failed: [],
      expired: [],
    });
    expect(prisma.matchParticipant.findMany).not.toHaveBeenCalled();
  });

  it("records progress without resolving while games are still coming in", async () => {
    withOpen([assignmentRow()]);
    withMatches(6.0, 6.0);

    const result = await checkAssignments(USER, ACCOUNT);

    expect(result).toMatchObject({ checked: 1, passed: [], failed: [] });
    expect(prisma.academyAssignment.update).toHaveBeenCalledWith({
      where: { id: "asg-1" },
      data: { gamesObserved: 2 },
    });
    expect(prisma.academyProgress.updateMany).not.toHaveBeenCalled();
  });

  // Passing is the only thing in the product that can mark a lesson mastered.
  it("masters the lesson when the average clears the target", async () => {
    withOpen([assignmentRow()]);
    withMatches(5.4, 6.0, 5.6);

    const result = await checkAssignments(USER, ACCOUNT);

    expect(result.passed).toEqual([LESSON]);
    expect(prisma.academyAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "passed", gamesObserved: 3 }),
      })
    );
    expect(prisma.academyProgress.updateMany).toHaveBeenCalledWith({
      where: { userId: USER, lessonId: LESSON },
      data: { status: "mastered", masteredAt: expect.any(Date) },
    });
  });

  it("leaves the lesson completed when the average falls short", async () => {
    withOpen([assignmentRow()]);
    withMatches(5.0, 5.0, 5.0);

    const result = await checkAssignments(USER, ACCOUNT);

    expect(result.failed).toEqual([LESSON]);
    expect(prisma.academyProgress.updateMany).not.toHaveBeenCalled();
  });

  it("writes the games that decided the verdict as evidence", async () => {
    withOpen([assignmentRow()]);
    withMatches(5.4, 6.0, 5.6);

    await checkAssignments(USER, ACCOUNT);

    const call = vi.mocked(prisma.academyAssignment.update).mock.calls[0][0] as unknown as {
      data: { evidence: { average: number; counted: unknown[] } };
    };
    expect(call.data.evidence.average).toBeCloseTo(5.6667, 3);
    expect(call.data.evidence.counted).toHaveLength(3);
  });

  it("expires an assignment that never collected its games", async () => {
    withOpen([assignmentRow({ startedAt: new Date(Date.now() - 30 * 86_400_000) })]);
    withMatches(9.0);

    const result = await checkAssignments(USER, ACCOUNT);

    expect(result.expired).toEqual([LESSON]);
    expect(prisma.academyProgress.updateMany).not.toHaveBeenCalled();
  });

  it("counts only ranked games in the assignment's role", async () => {
    withOpen([assignmentRow()]);
    withMatches(6.0);

    await checkAssignments(USER, ACCOUNT);

    const where = vi.mocked(prisma.matchParticipant.findMany).mock.calls[0][0] as unknown as {
      where: { position?: string; match: { queueType: { in: string[] } } };
    };
    expect(where.where.match.queueType.in).toEqual(["RANKED_SOLO_5x5", "RANKED_FLEX_SR"]);
    expect(where.where.position).toBe("MIDDLE");
  });

  // Rows written before the role fix carry no position and must still be judged.
  it("stays role-blind for an assignment opened before roles were pinned", async () => {
    withOpen([assignmentRow({ position: null })]);
    withMatches(6.0, 6.0, 6.0);

    const result = await checkAssignments(USER, ACCOUNT);

    const where = vi.mocked(prisma.matchParticipant.findMany).mock.calls[0][0] as unknown as {
      where: { position?: string };
    };
    expect(where.where.position).toBeUndefined();
    expect(result.passed).toEqual([LESSON]);
  });

  it("gives up quietly when the account has no puuid", async () => {
    withOpen([assignmentRow()]);
    vi.mocked(getAccountPuuid).mockResolvedValue(null);

    expect((await checkAssignments(USER, ACCOUNT)).checked).toBe(0);
    expect(prisma.matchParticipant.findMany).not.toHaveBeenCalled();
  });
});
