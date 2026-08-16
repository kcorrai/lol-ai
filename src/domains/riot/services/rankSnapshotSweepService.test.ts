import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { riotAccount: { count: vi.fn(), findMany: vi.fn() } },
}));
vi.mock("@/domains/riot/services/matchSyncRankedService", () => ({
  syncRankedSnapshot: vi.fn(),
}));
vi.mock("@/domains/riot/services/riotApiClient", () => ({
  assertRiotApiReachable: vi.fn(),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";
import { syncRankedSnapshot } from "@/domains/riot/services/matchSyncRankedService";
import { assertRiotApiReachable } from "@/domains/riot/services/riotApiClient";
import { sweepRankSnapshots } from "@/domains/riot/services/rankSnapshotSweepService";

function account(id: string) {
  return { id, gameName: `p${id}`, tagLine: "TR1" };
}

function haveAccounts(list: ReturnType<typeof account>[], total = list.length): void {
  vi.mocked(prisma.riotAccount.count).mockResolvedValue(total);
  vi.mocked(prisma.riotAccount.findMany).mockResolvedValue(list as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  // The sweep spaces its Riot calls; without fake timers each account would cost a real 250ms.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.mocked(syncRankedSnapshot).mockResolvedValue({ rankedSnapshotted: true, errors: [] } as never);
  vi.mocked(assertRiotApiReachable).mockResolvedValue(undefined);
});

describe("sweepRankSnapshots", () => {
  it("samples every connected account", async () => {
    haveAccounts([account("a"), account("b"), account("c")]);

    const result = await sweepRankSnapshots();

    expect(syncRankedSnapshot).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ attempted: 3, succeeded: 3, failed: 0, skippedOverCap: 0 });
  });

  // The whole point of the sweep is that a day's sample is unrecoverable, so one dead account
  // must not cost everyone else theirs.
  it("keeps going when one account throws", async () => {
    haveAccounts([account("a"), account("b"), account("c")]);
    vi.mocked(syncRankedSnapshot)
      .mockResolvedValueOnce({ rankedSnapshotted: true, errors: [] } as never)
      .mockRejectedValueOnce(new Error("Riot 503"))
      .mockResolvedValueOnce({ rankedSnapshotted: true, errors: [] } as never);

    const result = await sweepRankSnapshots();

    expect(syncRankedSnapshot).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({ attempted: 3, succeeded: 2, failed: 1 });
  });

  // syncRankedSnapshot catches Riot errors itself and answers with a flag instead of throwing, so
  // a sweep that only watched for throws would report a clean run while every sample was lost.
  it("counts a reported failure as failed, not succeeded", async () => {
    haveAccounts([account("a"), account("b")]);
    vi.mocked(syncRankedSnapshot)
      .mockResolvedValueOnce({ rankedSnapshotted: true, errors: [] } as never)
      .mockResolvedValueOnce({
        rankedSnapshotted: false,
        errors: ["Ranked sync failed: Riot 401"],
      } as never);

    const result = await sweepRankSnapshots();

    expect(result).toMatchObject({ attempted: 2, succeeded: 1, failed: 1 });
  });

  it("reports the remainder when more accounts exist than one run covers", async () => {
    haveAccounts([account("a")], 1201);

    const result = await sweepRankSnapshots();

    // Truncation is surfaced, not swallowed — a silent cap reads as a clean sweep.
    expect(result.skippedOverCap).toBe(1200);
  });

  it("takes the least recently updated accounts first", async () => {
    haveAccounts([account("a")]);

    await sweepRankSnapshots();

    expect(vi.mocked(prisma.riotAccount.findMany).mock.calls[0]?.[0]).toMatchObject({
      orderBy: { updatedAt: "asc" },
    });
  });

  // The ranked lookup answers `[]` for an expired key exactly as it does for an unranked player, so
  // without the preflight a dead key produces a full sweep that writes nothing and reports success.
  it("aborts before touching any account when Riot is unreachable", async () => {
    haveAccounts([account("a"), account("b")]);
    vi.mocked(assertRiotApiReachable).mockRejectedValue(new Error("Riot 401 Unauthorized"));

    const result = await sweepRankSnapshots();

    expect(syncRankedSnapshot).not.toHaveBeenCalled();
    expect(result.attempted).toBe(0);
    expect(result.abortedReason).toContain("401");
  });

  it("does nothing when no account is connected", async () => {
    haveAccounts([]);

    const result = await sweepRankSnapshots();

    expect(syncRankedSnapshot).not.toHaveBeenCalled();
    expect(result).toEqual({ attempted: 0, succeeded: 0, failed: 0, skippedOverCap: 0 });
  });
});
