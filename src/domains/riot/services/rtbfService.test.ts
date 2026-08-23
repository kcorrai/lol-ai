import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    riotAccount: { findMany: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
    matchParticipant: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/domains/riot/services/riotApiClient", () => ({ getAccountByPuuid: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { getAccountByPuuid } from "@/domains/riot/services/riotApiClient";
import { ApiError } from "@/lib/api/errors";
import { checkForgotten, isRtbfName, purgeForgotten, sweepForgottenAccounts } from "./rtbfService";

const tx = {
  matchParticipant: { updateMany: vi.fn() },
  riotAccount: { deleteMany: vi.fn() },
};

beforeEach(() => {
  vi.resetAllMocks();
  tx.matchParticipant.updateMany.mockResolvedValue({ count: 0 });
  tx.riotAccount.deleteMany.mockResolvedValue({ count: 0 });
  vi.mocked(prisma.$transaction).mockImplementation(((fn: (c: unknown) => unknown) =>
    fn(tx)) as never);
});

describe("isRtbfName", () => {
  it.each(["rtbf12345", "RTBF999", "rtbf", "  rtbf42  "])("flags %j", (name) => {
    expect(isRtbfName(name)).toBe(true);
  });

  /**
   * These are the false positives that would delete a real player's data. The
   * marker is the *whole* name, so a legitimate player who happens to contain
   * the substring must not match.
   */
  it.each(["rtbfan", "notrtbf", "Rtbf Player", "artbf1", "", null, undefined])(
    "does not flag %j",
    (name) => {
      expect(isRtbfName(name)).toBe(false);
    }
  );
});

describe("checkForgotten", () => {
  it("reports a renamed account as forgotten", async () => {
    vi.mocked(getAccountByPuuid).mockResolvedValue({
      puuid: "p1",
      gameName: "rtbf12345",
      tagLine: "TR1",
    });

    expect(await checkForgotten("p1", "tr1")).toEqual({ forgotten: true, reason: "renamed" });
  });

  it("reports a live account as not forgotten", async () => {
    vi.mocked(getAccountByPuuid).mockResolvedValue({
      puuid: "p1",
      gameName: "kaanproak0",
      tagLine: "TR1",
    });

    expect(await checkForgotten("p1", "tr1")).toEqual({ forgotten: false });
  });

  it("treats a 404 as forgotten", async () => {
    vi.mocked(getAccountByPuuid).mockRejectedValue(new ApiError("RIOT_NOT_FOUND", "gone", 404));

    expect(await checkForgotten("p1", "tr1")).toEqual({ forgotten: true, reason: "gone" });
  });

  /**
   * The safety property that matters most: a purge is irreversible, so anything
   * short of a definitive answer from Riot must propagate rather than resolve to
   * "forgotten". A rate limit during an outage must never delete a real player.
   */
  it.each([
    ["RIOT_RATE_LIMITED", 429],
    ["RIOT_API_UNAVAILABLE", 503],
    ["RIOT_UNAUTHORIZED", 401],
  ])("propagates %s instead of assuming forgotten", async (code, status) => {
    vi.mocked(getAccountByPuuid).mockRejectedValue(new ApiError(code, "x", status));

    await expect(checkForgotten("p1", "tr1")).rejects.toThrow();
  });
});

describe("purgeForgotten", () => {
  it("scrubs participant identity and deletes the account", async () => {
    tx.matchParticipant.updateMany.mockResolvedValue({ count: 7 });
    tx.riotAccount.deleteMany.mockResolvedValue({ count: 1 });

    const result = await purgeForgotten("p1");

    expect(tx.matchParticipant.updateMany).toHaveBeenCalledWith({
      where: { puuid: "p1" },
      data: { gameName: null, tagLine: null },
    });
    expect(result).toEqual({ participantsScrubbed: 7, accountsDeleted: 1 });
  });

  /**
   * Ordering is load-bearing. RiotAccount's relation from MatchParticipant is
   * optional with no cascade (schema.prisma:376), so deleting the account first
   * nulls `riotAccountId` and leaves the names behind with no way back to them.
   */
  it("scrubs before deleting", async () => {
    const order: string[] = [];
    tx.matchParticipant.updateMany.mockImplementation(async () => {
      order.push("scrub");
      return { count: 1 };
    });
    tx.riotAccount.deleteMany.mockImplementation(async () => {
      order.push("delete");
      return { count: 1 };
    });

    await purgeForgotten("p1");

    expect(order).toEqual(["scrub", "delete"]);
  });

  it("runs both writes in one transaction", async () => {
    await purgeForgotten("p1");

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.matchParticipant.updateMany).not.toHaveBeenCalled();
    expect(prisma.riotAccount.deleteMany).not.toHaveBeenCalled();
  });

  /**
   * A player who never connected an account here still has MatchParticipant rows
   * from other people's matches. Those are the bulk of the retained personal data,
   * so the purge must not be a no-op when there is no RiotAccount to delete.
   */
  it("still scrubs when the player never connected an account", async () => {
    tx.matchParticipant.updateMany.mockResolvedValue({ count: 4 });
    tx.riotAccount.deleteMany.mockResolvedValue({ count: 0 });

    const result = await purgeForgotten("p1");

    expect(result).toEqual({ participantsScrubbed: 4, accountsDeleted: 0 });
  });
});

describe("sweepForgottenAccounts", () => {
  function staleAccounts(n: number) {
    return Array.from({ length: n }, (_, i) => ({ puuid: `p${i}`, region: "tr1" }));
  }

  it("only selects accounts past the 30-day window", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.riotAccount.count).mockResolvedValue(0 as never);

    await sweepForgottenAccounts();

    const where = vi.mocked(prisma.riotAccount.findMany).mock.calls[0][0]!.where as {
      OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: Date } }];
    };
    const cutoff = where.OR[1].lastSyncedAt.lt;
    const days = (Date.now() - cutoff.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBeCloseTo(30, 1);
    expect(where.OR[0]).toEqual({ lastSyncedAt: null });
  });

  it("purges the accounts Riot reports as forgotten", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(staleAccounts(2) as never);
    vi.mocked(prisma.riotAccount.count).mockResolvedValue(2 as never);
    vi.mocked(getAccountByPuuid)
      .mockResolvedValueOnce({ puuid: "p0", gameName: "rtbf1", tagLine: "T" })
      .mockResolvedValueOnce({ puuid: "p1", gameName: "RealPlayer", tagLine: "T" });

    const result = await sweepForgottenAccounts();

    expect(result).toMatchObject({ checked: 2, forgotten: 1, failed: 0 });
    expect(tx.riotAccount.deleteMany).toHaveBeenCalledTimes(1);
  });

  /**
   * A single unreachable account used to be enough to abandon the rest of the
   * batch, which would stall the 30-day obligation behind one bad row.
   */
  it("continues past a failing account and counts it", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(staleAccounts(3) as never);
    vi.mocked(prisma.riotAccount.count).mockResolvedValue(3 as never);
    vi.mocked(getAccountByPuuid)
      .mockRejectedValueOnce(new ApiError("RIOT_RATE_LIMITED", "429", 429))
      .mockResolvedValueOnce({ puuid: "p1", gameName: "rtbf7", tagLine: "T" })
      .mockResolvedValueOnce({ puuid: "p2", gameName: "Live", tagLine: "T" });

    const result = await sweepForgottenAccounts();

    expect(result).toMatchObject({ checked: 3, forgotten: 1, failed: 1 });
  });

  /**
   * A capped batch that reported nothing would be indistinguishable from full
   * coverage — exactly the silent-truncation failure the cap is supposed to make
   * visible.
   */
  it("reports the backlog left behind by the batch cap", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(staleAccounts(2) as never);
    vi.mocked(prisma.riotAccount.count).mockResolvedValue(120 as never);
    vi.mocked(getAccountByPuuid).mockResolvedValue({ puuid: "x", gameName: "Live", tagLine: "T" });

    const result = await sweepForgottenAccounts(2);

    expect(result.remaining).toBe(118);
    expect(vi.mocked(prisma.riotAccount.findMany).mock.calls[0][0]!.take).toBe(2);
  });

  it("purges nothing when every account is live", async () => {
    vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(staleAccounts(3) as never);
    vi.mocked(prisma.riotAccount.count).mockResolvedValue(3 as never);
    vi.mocked(getAccountByPuuid).mockResolvedValue({ puuid: "x", gameName: "Live", tagLine: "T" });

    const result = await sweepForgottenAccounts();

    expect(result.forgotten).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
