import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    challenge: { findMany: vi.fn() },
    matchParticipant: { findMany: vi.fn() },
    userChallenge: { update: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/domains/riot/services/accountLookup", () => ({ getAccountPuuid: vi.fn() }));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import { checkAndUpdateChallengeProgress } from "./challengeProgressService";

const USER_ID = "user-1";
const RIOT_ACCOUNT_ID = "acc-1";

/** Stands in for the client Prisma hands the interactive-transaction callback. */
function fakeTx() {
  return {
    userChallenge: { update: vi.fn().mockResolvedValue({}) },
    user: { update: vi.fn().mockResolvedValue({ xp: 100, level: 1 }) },
  };
}

/** One active, incomplete challenge: 3 deaths or fewer, worth 50 XP. */
function activeChallenge(targetValue = 3) {
  vi.mocked(prisma.challenge.findMany).mockResolvedValue([
    {
      id: "challenge-1",
      type: "daily",
      metric: "deaths",
      targetValue,
      description: "Die 3 times or fewer",
      xpReward: 50,
      validFrom: new Date("2026-07-20T00:00:00Z"),
      validUntil: new Date("2026-07-21T00:00:00Z"),
      userChallenges: [{ progress: 0, completed: false, completedAt: null }],
    },
  ] as never);
}

/** `count` matches drive progress; TEMPLATES.deaths decides how many are needed. */
function matchesWithDeaths(deaths: number[]) {
  vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(
    deaths.map((d) => ({
      deaths: d,
      csPerMinute: 6,
      visionScore: 20,
      kills: 5,
      assists: 5,
      won: true,
    })) as never
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getAccountPuuid).mockResolvedValue("puuid-1");
});

describe("checkAndUpdateChallengeProgress", () => {
  it("does nothing when there are no active challenges", async () => {
    vi.mocked(prisma.challenge.findMany).mockResolvedValue([]);

    await checkAndUpdateChallengeProgress(USER_ID, RIOT_ACCOUNT_ID);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  /**
   * The defect this task closes: the challenge update and the XP award used to be separate
   * statements, so a failed XP write left the challenge permanently complete with no reward.
   */
  it("marks the challenge complete and awards XP on the same transaction client", async () => {
    activeChallenge();
    matchesWithDeaths(Array(20).fill(0)); // every match satisfies the target
    const tx = fakeTx();
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn) => (fn as never as (t: unknown) => Promise<unknown>)(tx) as never
    );

    await checkAndUpdateChallengeProgress(USER_ID, RIOT_ACCOUNT_ID);

    expect(tx.userChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ completed: true }) })
    );
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { xp: { increment: 50 } } })
    );
    // Neither write may go to the singleton, or they are outside the transaction.
    expect(prisma.userChallenge.update).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("propagates a failed XP award so the completion rolls back", async () => {
    activeChallenge();
    matchesWithDeaths(Array(20).fill(0));
    const tx = fakeTx();
    tx.user.update.mockRejectedValue(new Error("xp write failed"));
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn) => (fn as never as (t: unknown) => Promise<unknown>)(tx) as never
    );

    await expect(checkAndUpdateChallengeProgress(USER_ID, RIOT_ACCOUNT_ID)).rejects.toThrow(
      "xp write failed"
    );
  });

  it("records progress without awarding XP when the challenge is not complete", async () => {
    activeChallenge();
    matchesWithDeaths(Array(20).fill(10)); // 10 deaths — never satisfies "3 or fewer"
    const tx = fakeTx();
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn) => (fn as never as (t: unknown) => Promise<unknown>)(tx) as never
    );

    await checkAndUpdateChallengeProgress(USER_ID, RIOT_ACCOUNT_ID);

    expect(tx.userChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completed: false, completedAt: null }),
      })
    );
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("levels the user up in the same transaction when the XP crosses a threshold", async () => {
    activeChallenge();
    matchesWithDeaths(Array(20).fill(0));
    const tx = fakeTx();
    tx.user.update.mockResolvedValueOnce({ xp: 1000, level: 1 });
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn) => (fn as never as (t: unknown) => Promise<unknown>)(tx) as never
    );

    await checkAndUpdateChallengeProgress(USER_ID, RIOT_ACCOUNT_ID);

    expect(tx.user.update).toHaveBeenCalledTimes(2);
    expect(tx.user.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ level: expect.any(Number) }) })
    );
  });
});
