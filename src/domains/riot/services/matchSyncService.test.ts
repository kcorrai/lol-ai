import { describe, it, expect, vi, beforeEach } from "vitest";
import { backfillMatchNicknames, syncAccount } from "./matchSyncService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    riotAccount: { findUnique: vi.fn(), update: vi.fn() },
    match: { findMany: vi.fn(), create: vi.fn() },
    matchParticipant: { updateMany: vi.fn(), createMany: vi.fn(), findMany: vi.fn() },
    rankedHistory: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/riot/lifecycle", () => ({
  isDataStale: vi.fn(),
  invalidateAccountCache: vi.fn(),
}));

vi.mock("@/domains/riot/services/riotApiClient", () => ({
  getMatchIds: vi.fn(),
  getMatch: vi.fn(),
  getRankedEntries: vi.fn(),
  getRankedEntriesByPuuidDirect: vi.fn(),
  getSummonerByPuuid: vi.fn(),
}));

vi.mock("@/domains/riot/mappers/matchMapper", () => ({
  mapMatch: vi.fn(),
}));

vi.mock("@/domains/riot/services/rankedService", () => ({
  getLastRankedSnapshot: vi.fn(),
}));

vi.mock("@/domains/champions/services/championCacheService", () => ({
  refreshChampionStats: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/auth/authorization", () => ({
  getPlanLimits: vi.fn().mockResolvedValue({ matchHistoryDepth: 20 }),
}));

vi.mock("@/lib/ai/aiCache", () => ({
  deleteCached: vi.fn().mockResolvedValue(undefined),
  buildCacheKey: vi.fn().mockReturnValue("cache-key"),
}));

vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@/lib/api/errors", () => ({
  Errors: { notFound: (msg: string) => new Error(`Not found: ${msg}`) },
}));

import { prisma } from "@/lib/db/prisma";
import { isDataStale } from "@/lib/riot/lifecycle";
import { getMatch } from "@/domains/riot/services/riotApiClient";

// ── backfillMatchNicknames ─────────────────────────────────────────────────────

describe("backfillMatchNicknames", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates participants that have no gameName", async () => {
    vi.mocked(getMatch).mockResolvedValue({
      info: {
        participants: [
          { puuid: "p1", riotIdGameName: "KaaN", riotIdTagline: "TR1" },
          { puuid: "p2", riotIdGameName: "Faker", riotIdTagline: "KR1" },
        ],
      },
    } as never);
    vi.mocked(prisma.matchParticipant.updateMany).mockResolvedValue({ count: 1 } as never);

    await backfillMatchNicknames("db-match-1", "TR1_abc123", "euw1");

    expect(prisma.matchParticipant.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.matchParticipant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ puuid: "p1", gameName: null }) })
    );
  });

  it("skips participants with no riotIdGameName", async () => {
    vi.mocked(getMatch).mockResolvedValue({
      info: {
        participants: [
          { puuid: "p1", riotIdGameName: "", riotIdTagline: "TR1" },
          { puuid: "p2", riotIdGameName: null, riotIdTagline: null },
        ],
      },
    } as never);

    await backfillMatchNicknames("db-match-1", "TR1_abc", "euw1");

    expect(prisma.matchParticipant.updateMany).not.toHaveBeenCalled();
  });

  it("swallows errors without throwing", async () => {
    vi.mocked(getMatch).mockRejectedValue(new Error("Riot 503"));

    await expect(backfillMatchNicknames("db-1", "riot-1", "euw1")).resolves.toBeUndefined();
  });
});

// ── syncAccount ───────────────────────────────────────────────────────────────

describe("syncAccount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws not-found when account does not exist", async () => {
    vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue(null);

    await expect(syncAccount("non-existent-id")).rejects.toThrow("Not found");
  });

  it("returns early with zero counts when data is not stale", async () => {
    vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue({
      id: "acc-1", lastSyncedAt: new Date(), gameName: "KaaN", tagLine: "TR1",
      puuid: "puuid-1", region: "euw1", summonerId: "sum-1", userId: "user-1",
    } as never);
    vi.mocked(isDataStale).mockReturnValue(false);

    const result = await syncAccount("acc-1");

    expect(result).toEqual({ newMatches: 0, skipped: 0, rankedSnapshotted: false, errors: [] });
  });

  // The linking pass used to be a loop: one updateMany per already-known match, up to a hundred
  // sequential round trips per sync, and after the first successful sync every one of them matched
  // zero rows. It has to stay one statement covering every known match.
  it("links every already-known match in a single statement", async () => {
    vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue({
      id: "acc-1", lastSyncedAt: null, gameName: "KaaN", tagLine: "TR1",
      puuid: "puuid-1", region: "euw1", summonerId: "sum-1", userId: "user-1",
    } as never);
    vi.mocked(isDataStale).mockReturnValue(true);

    const { getMatchIds, getRankedEntriesByPuuidDirect } = await import(
      "@/domains/riot/services/riotApiClient"
    );
    vi.mocked(getMatchIds).mockResolvedValue(["EUW_1", "EUW_2", "EUW_3"]);
    // All three already in the database, so nothing is ingested and only the link pass runs.
    vi.mocked(prisma.match.findMany).mockResolvedValue([
      { id: "db-1", matchId: "EUW_1" },
      { id: "db-2", matchId: "EUW_2" },
      { id: "db-3", matchId: "EUW_3" },
    ] as never);
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([]);
    vi.mocked(prisma.matchParticipant.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);
    vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([]);
    vi.mocked(prisma.riotAccount.update).mockResolvedValue({} as never);

    await syncAccount("acc-1", true);

    expect(prisma.matchParticipant.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.matchParticipant.updateMany).toHaveBeenCalledWith({
      where: {
        matchId: { in: ["db-1", "db-2", "db-3"] },
        puuid: "puuid-1",
        riotAccountId: null,
      },
      data: { riotAccountId: "acc-1" },
    });
  });

  it("issues no linking statement when nothing is already known", async () => {
    vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue({
      id: "acc-1", lastSyncedAt: null, gameName: "KaaN", tagLine: "TR1",
      puuid: "puuid-1", region: "euw1", summonerId: "sum-1", userId: "user-1",
    } as never);
    vi.mocked(isDataStale).mockReturnValue(true);

    const { getMatchIds, getRankedEntriesByPuuidDirect } = await import(
      "@/domains/riot/services/riotApiClient"
    );
    vi.mocked(getMatchIds).mockResolvedValue([]);
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([]);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);
    vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([]);
    vi.mocked(prisma.riotAccount.update).mockResolvedValue({} as never);

    await syncAccount("acc-1", true);

    expect(prisma.matchParticipant.updateMany).not.toHaveBeenCalled();
  });

  it("force=true bypasses staleness check", async () => {
    vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue({
      id: "acc-1", lastSyncedAt: new Date(), gameName: "KaaN", tagLine: "TR1",
      puuid: "puuid-1", region: "euw1", summonerId: "sum-1", userId: "user-1",
    } as never);
    vi.mocked(isDataStale).mockReturnValue(false);

    const { getMatchIds } = await import("@/domains/riot/services/riotApiClient");
    vi.mocked(getMatchIds).mockResolvedValue([]);
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([]);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);

    const { getRankedEntries } = await import("@/domains/riot/services/riotApiClient");
    vi.mocked(getRankedEntries).mockResolvedValue([]);
    vi.mocked(prisma.riotAccount.update).mockResolvedValue({} as never);

    const result = await syncAccount("acc-1", true);

    expect(getMatchIds).toHaveBeenCalled();
    expect(result.newMatches).toBe(0);
  });
});
