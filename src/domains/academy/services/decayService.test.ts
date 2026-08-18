import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    academyProgress: { findMany: vi.fn(), update: vi.fn() },
    academyAssignment: { findFirst: vi.fn() },
    matchParticipant: { findMany: vi.fn() },
  },
}));

vi.mock("@/domains/riot", () => ({ listAccounts: vi.fn(), getAccountPuuid: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid, listAccounts } from "@/domains/riot";
import { checkMasteryDecay } from "./decayService";

const USER = "user-1";
const LESSON = "foundations/minions-and-gold";
const NOW = new Date("2026-08-18T06:00:00Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

function progressRow(over: Record<string, unknown> = {}) {
  return {
    id: "prog-1",
    userId: USER,
    lessonId: LESSON,
    masteredAt: daysAgo(30),
    decayCheckedAt: null,
    ...over,
  };
}

/** The assignment that earned the mastery: 5.6 CS/min over 3 games, as mid. */
function assignmentRow(over: Record<string, unknown> = {}) {
  return {
    id: "asg-1",
    userId: USER,
    lessonId: LESSON,
    metric: "csPerMinute",
    direction: "increase",
    target: 5.6,
    gamesRequired: 3,
    position: "MIDDLE",
    status: "passed",
    ...over,
  };
}

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
      gameStart: new Date(`2026-08-1${i}T00:00:00Z`),
      participants: [{ teamId: 100, kills: 3 }],
    },
  };
}

function withMatchRows(...cs: number[]): void {
  vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(cs.map(matchRow) as never);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listAccounts).mockResolvedValue([{ id: "acc-1", isPrimary: true }] as never);
  vi.mocked(getAccountPuuid).mockResolvedValue("puuid-1");
  vi.mocked(prisma.academyProgress.findMany).mockResolvedValue([progressRow()] as never);
  vi.mocked(prisma.academyAssignment.findFirst).mockResolvedValue(assignmentRow() as never);
});

describe("checkMasteryDecay", () => {
  it("drops a lesson to review when the player is no longer holding the target", async () => {
    withMatchRows(4.4, 4.9, 5.0);

    const result = await checkMasteryDecay(NOW);

    expect(prisma.academyProgress.update).toHaveBeenCalledWith({
      where: { id: "prog-1" },
      data: { decayCheckedAt: NOW, status: "review" },
    });
    expect(result).toMatchObject({ checked: 1, holding: 0, decayed: [`${USER}/${LESSON}`] });
  });

  it("leaves a mastery alone when the habit is still there, and stamps the check", async () => {
    withMatchRows(6.1, 5.8, 6.4);

    const result = await checkMasteryDecay(NOW);

    expect(prisma.academyProgress.update).toHaveBeenCalledWith({
      where: { id: "prog-1" },
      data: { decayCheckedAt: NOW },
    });
    expect(result).toMatchObject({ checked: 1, holding: 1, decayed: [] });
  });

  // Silence is not regression, and stamping here would sleep the row for another three weeks
  // when what it is actually waiting for is games.
  it("does not stamp or demote a player who has not played the role since the last check", async () => {
    withMatchRows(4.0);

    const result = await checkMasteryDecay(NOW);

    expect(prisma.academyProgress.update).not.toHaveBeenCalled();
    expect(result).toMatchObject({ checked: 1, unmeasured: 1, decayed: [] });
  });

  it("judges against the stored target rather than re-measuring a baseline", async () => {
    withMatchRows(6.1, 5.8, 6.4);

    await checkMasteryDecay(NOW);

    // Only the verdict read — no second query for a fresh baseline.
    expect(prisma.matchParticipant.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.matchParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ puuid: "puuid-1", position: "MIDDLE" }),
        take: 3,
      })
    );
  });

  it("skips a mastery with no passed assignment behind it", async () => {
    vi.mocked(prisma.academyAssignment.findFirst).mockResolvedValue(null as never);

    const result = await checkMasteryDecay(NOW);

    expect(prisma.academyProgress.update).not.toHaveBeenCalled();
    expect(result.checked).toBe(0);
  });

  it("skips a player with no linked Riot account", async () => {
    vi.mocked(listAccounts).mockResolvedValue([] as never);

    const result = await checkMasteryDecay(NOW);

    expect(prisma.academyAssignment.findFirst).not.toHaveBeenCalled();
    expect(result.checked).toBe(0);
  });

  // The window counts from the last check once there has been one.
  it("ignores a row checked inside the window even if the prefilter returns it", async () => {
    vi.mocked(prisma.academyProgress.findMany).mockResolvedValue([
      progressRow({ decayCheckedAt: daysAgo(3) }),
    ] as never);

    const result = await checkMasteryDecay(NOW);

    expect(result.checked).toBe(0);
    expect(prisma.academyProgress.update).not.toHaveBeenCalled();
  });
});
