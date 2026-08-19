import { describe, it, expect, vi, beforeEach } from "vitest";
import { backfillMatchNicknames, syncAccount } from "./matchSyncService";
import { NO_RIOT_NAME } from "./matchSyncRankedService";

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

vi.mock("@/domains/riot/services/playerIndexService", () => ({
  indexPlayers: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/lib/ai/aiCache", () => ({
  deleteCachedMany: vi.fn().mockResolvedValue(undefined),
  buildCacheKey: vi.fn((type: string, i: Record<string, string>) => `${type}:${i.position}`),
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

  // Used to `continue` past these, leaving the rows null. The caller's trigger is "any participant
  // has no name", so for a match containing a bot or a deactivated account the condition could
  // never become false: every view re-fetched the whole match from Riot and rewrote ten rows, for
  // ever, spending a rate-limit token the sync needs. The sentinel is what lets it settle.
  it("marks participants Riot will not name, so it does not ask again", async () => {
    vi.mocked(getMatch).mockResolvedValue({
      info: {
        participants: [
          { puuid: "p1", riotIdGameName: "", riotIdTagline: "TR1" },
          { puuid: "p2", riotIdGameName: null, riotIdTagline: null },
        ],
      },
    } as never);
    vi.mocked(prisma.matchParticipant.updateMany).mockResolvedValue({ count: 2 } as never);

    await backfillMatchNicknames("db-match-1", "TR1_abc", "euw1");

    expect(prisma.matchParticipant.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.matchParticipant.updateMany).toHaveBeenCalledWith({
      where: { matchId: "db-match-1", puuid: { in: ["p1", "p2"] }, gameName: null },
      data: { gameName: NO_RIOT_NAME },
    });
  });

  it("marks the unnamed in one statement while naming the rest", async () => {
    vi.mocked(getMatch).mockResolvedValue({
      info: {
        participants: [
          { puuid: "p1", riotIdGameName: "KaaN", riotIdTagline: "TR1" },
          { puuid: "p2", riotIdGameName: null, riotIdTagline: null },
          { puuid: "p3", riotIdGameName: null, riotIdTagline: null },
        ],
      },
    } as never);
    vi.mocked(prisma.matchParticipant.updateMany).mockResolvedValue({ count: 1 } as never);

    await backfillMatchNicknames("db-match-1", "TR1_abc", "euw1");

    // One for the named participant, one covering both unnamed — not one per participant.
    expect(prisma.matchParticipant.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.matchParticipant.updateMany).toHaveBeenCalledWith({
      where: { matchId: "db-match-1", puuid: { in: ["p2", "p3"] }, gameName: null },
      data: { gameName: NO_RIOT_NAME },
    });
  });

  // Only rows that were never asked about. A row already carrying the sentinel is not null and is
  // therefore not rewritten, which is what makes the marker terminal.
  it("only ever touches rows whose name is still null", async () => {
    vi.mocked(getMatch).mockResolvedValue({
      info: { participants: [{ puuid: "p1", riotIdGameName: null, riotIdTagline: null }] },
    } as never);
    vi.mocked(prisma.matchParticipant.updateMany).mockResolvedValue({ count: 0 } as never);

    await backfillMatchNicknames("db-match-1", "TR1_abc", "euw1");

    for (const call of vi.mocked(prisma.matchParticipant.updateMany).mock.calls) {
      expect((call[0] as { where: { gameName: unknown } }).where.gameName).toBeNull();
    }
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

  // The ingest loop was strictly serial: one Riot round trip plus a transaction at a time, up to a
  // hundred of them, against a limiter that allows twenty a second. These assert the concurrent
  // version reports exactly what the sequential one did.
  describe("concurrent ingestion", () => {
    async function ingest(
      ids: string[],
      mapper: (id: string) => unknown,
      onFetch?: (id: string) => Promise<void>
    ) {
      vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue({
        id: "acc-1", lastSyncedAt: null, gameName: "KaaN", tagLine: "TR1",
        puuid: "puuid-1", region: "euw1", summonerId: "sum-1", userId: "user-1",
      } as never);
      vi.mocked(isDataStale).mockReturnValue(true);

      const { getMatchIds, getRankedEntriesByPuuidDirect } = await import(
        "@/domains/riot/services/riotApiClient"
      );
      const { mapMatch } = await import("@/domains/riot/mappers/matchMapper");

      vi.mocked(getMatchIds).mockResolvedValue(ids);
      vi.mocked(prisma.match.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([] as never);
      vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([] as never);
      vi.mocked(prisma.riotAccount.update).mockResolvedValue({} as never);
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) =>
        typeof fn === "function"
          ? (fn as (tx: unknown) => unknown)({
              match: { create: vi.fn() },
              matchParticipant: { createMany: vi.fn() },
            })
          : undefined
      );
      vi.mocked(getMatch).mockImplementation(async (id: string) => {
        if (onFetch) await onFetch(id);
        return { id } as never;
      });
      vi.mocked(mapMatch).mockImplementation((dto: unknown) =>
        mapper((dto as { id: string }).id) as never
      );

      return syncAccount("acc-1", true);
    }

    const ok = (id: string) => ({
      match: { queueType: "RANKED_SOLO_5x5" },
      participants: [{ puuid: `p-${id}`, gameName: "A", tagLine: "1" }],
    });

    it("counts every ingested match", async () => {
      const result = await ingest(["A", "B", "C", "D", "E"], ok);

      expect(result.newMatches).toBe(5);
      expect(result.skipped).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it("counts an unmappable match as skipped, not ingested", async () => {
      const result = await ingest(["A", "B", "C"], (id) => (id === "B" ? null : ok(id)));

      expect(result.newMatches).toBe(2);
      expect(result.skipped).toBe(1);
    });

    // One unreadable match must not end the run — the same guarantee the sequential loop's
    // per-iteration try/catch gave.
    it("keeps going when one match throws, and names it in the errors", async () => {
      const result = await ingest(["A", "B", "C"], (id) => {
        if (id === "B") throw new Error("riot 500");
        return ok(id);
      });

      expect(result.newMatches).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("B");
      expect(result.errors[0]).toContain("riot 500");
    });

    it("indexes the players of every ingested match exactly once", async () => {
      const { indexPlayers } = await import("@/domains/riot/services/playerIndexService");
      await ingest(["A", "B", "C"], ok);

      const indexed = vi.mocked(indexPlayers).mock.calls[0][0] as unknown as Array<{ puuid: string }>;
      expect(indexed.map((p) => p.puuid).sort()).toEqual(["p-A", "p-B", "p-C"]);
    });

    // Asserted on the interleaving of start/end events rather than on wall-clock overlap, so it
    // cannot flake when the suite runs the whole file under load.
    // Seven separate sends, none awaited. On Vercel an unawaited promise can be dropped when the
    // response returns, so the durable work these start was not reliably starting.
    it("dispatches every post-sync event in one awaited send", async () => {
      const { inngest } = await import("@/inngest/client");
      await ingest(["A", "B", "C"], ok);

      expect(inngest.send).toHaveBeenCalledTimes(1);
      const sent = vi.mocked(inngest.send).mock.calls[0][0] as Array<{ name: string }>;
      expect(Array.isArray(sent)).toBe(true);
      expect(sent.map((e) => e.name).sort()).toEqual([
        "academy/check-assignments",
        "achievement/check",
        "challenge/check-progress",
        "match/enrich-ranks",
        "match/session.synced",
        "snapshot/compute",
        "tilt/check-streak",
        "timeline/fetch-for-account",
      ]);
    });

    it("omits the new-match events when nothing was ingested", async () => {
      const { inngest } = await import("@/inngest/client");
      await ingest([], ok);

      const sent = vi.mocked(inngest.send).mock.calls[0][0] as Array<{ name: string }>;
      const names = sent.map((e) => e.name);
      expect(names).not.toContain("match/enrich-ranks");
      expect(names).not.toContain("timeline/fetch-for-account");
      expect(names).toContain("snapshot/compute");
    });

    it("busts the six matchup-matrix keys in one call", async () => {
      const { deleteCachedMany } = await import("@/lib/ai/aiCache");
      await ingest(["A"], ok);

      expect(deleteCachedMany).toHaveBeenCalledTimes(1);
      expect(vi.mocked(deleteCachedMany).mock.calls[0][0]).toHaveLength(6);
    });

    it("does not run the matches strictly one after another", async () => {
      const events: string[] = [];
      let inFlight = 0;
      let peak = 0;

      await ingest(Array.from({ length: 16 }, (_, i) => `M${i}`), ok, async (id) => {
        events.push(`start:${id}`);
        inFlight++;
        peak = Math.max(peak, inFlight);
        // One microtask turn is enough to let a sibling task start, and needs no timer.
        await Promise.resolve();
        await Promise.resolve();
        inFlight--;
        events.push(`end:${id}`);
      });

      // Strictly sequential work reads start,end,start,end… A second start before the matching end
      // is only possible if two are in flight together.
      const overlapped = events.some(
        (e, i) => i > 0 && e.startsWith("start:") && events[i - 1].startsWith("start:")
      );
      expect(overlapped).toBe(true);

      // Concurrent, but bounded: the Riot limiter is a fixed budget every caller draws on, so an
      // unbounded fan-out would spend it all at once.
      expect(peak).toBeLessThanOrEqual(8);
    });
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
