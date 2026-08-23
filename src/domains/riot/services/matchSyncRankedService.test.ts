import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { matchParticipant: { updateMany: vi.fn() } },
}));

vi.mock("@/domains/riot/services/riotApiClient", () => ({
  getRankedEntriesByPuuidDirect: vi.fn(),
  getMatch: vi.fn(),
  getSummonerByPuuid: vi.fn(),
}));

vi.mock("@/domains/riot/services/rankedService", () => ({ getLastRankedSnapshot: vi.fn() }));
vi.mock("@/inngest/client", () => ({ inngest: { send: vi.fn() } }));

import { prisma } from "@/lib/db/prisma";
import { getRankedEntriesByPuuidDirect } from "@/domains/riot/services/riotApiClient";
import { enrichParticipantRanks } from "@/domains/riot/services/matchSyncRankedService";

const MATCH = "match-1";
const REGION = "euw1";

function entry(over: Record<string, unknown> = {}) {
  return {
    queueType: "RANKED_SOLO_5x5",
    tier: "GOLD",
    rank: "II",
    leaguePoints: 42,
    wins: 10,
    losses: 8,
    hotStreak: false,
    inactive: false,
    ...over,
  };
}

const puuids = (n: number) => Array.from({ length: n }, (_, i) => `puuid-${i}`);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.matchParticipant.updateMany).mockResolvedValue({ count: 1 } as never);
});

describe("enrichParticipantRanks", () => {
  it("looks each participant up exactly once", async () => {
    vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([entry()] as never);

    await enrichParticipantRanks(MATCH, puuids(10), REGION);

    expect(getRankedEntriesByPuuidDirect).toHaveBeenCalledTimes(10);
  });

  // It used to await the ten lookups strictly one after another, and was itself fired once per
  // ingested match without being awaited — so a fifty-match sync had five hundred of these in
  // flight against a twenty-a-second budget.
  it("bounds how many lookups are in flight at once", async () => {
    let inFlight = 0;
    let peak = 0;
    vi.mocked(getRankedEntriesByPuuidDirect).mockImplementation(async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 2));
      inFlight--;
      return [entry()] as never;
    });

    await enrichParticipantRanks(MATCH, puuids(10), REGION);

    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThanOrEqual(5);
  });

  // Ten players in a game hold a handful of distinct ranks between them, so grouping turns ten
  // writes into three or four.
  it("writes once per distinct rank, not once per participant", async () => {
    vi.mocked(getRankedEntriesByPuuidDirect)
      .mockResolvedValueOnce([entry({ tier: "GOLD", rank: "II", leaguePoints: 42 })] as never)
      .mockResolvedValueOnce([entry({ tier: "GOLD", rank: "II", leaguePoints: 42 })] as never)
      .mockResolvedValue([entry({ tier: "SILVER", rank: "I", leaguePoints: 10 })] as never);

    await enrichParticipantRanks(MATCH, puuids(4), REGION);

    expect(prisma.matchParticipant.updateMany).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(prisma.matchParticipant.updateMany).mock.calls;
    const gold = calls.find(
      (c) => (c[0] as never as { data: { rankTier: string } }).data.rankTier === "GOLD"
    );
    expect((gold?.[0] as never as { where: { puuid: { in: string[] } } }).where.puuid.in).toEqual([
      "puuid-0",
      "puuid-1",
    ]);
  });

  it("lets nine players keep their rank when the tenth lookup fails", async () => {
    vi.mocked(getRankedEntriesByPuuidDirect)
      .mockRejectedValueOnce(new Error("riot down"))
      .mockResolvedValue([entry()] as never);

    await enrichParticipantRanks(MATCH, puuids(10), REGION);

    const written = vi
      .mocked(prisma.matchParticipant.updateMany)
      .mock.calls.flatMap(
        (c) => (c[0] as never as { where: { puuid: { in: string[] } } }).where.puuid.in
      );
    expect(written).toHaveLength(9);
    expect(written).not.toContain("puuid-0");
  });

  it("writes nothing when nobody has a solo-queue rank", async () => {
    vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([
      entry({ queueType: "RANKED_FLEX_SR" }),
    ] as never);

    await enrichParticipantRanks(MATCH, puuids(5), REGION);

    expect(prisma.matchParticipant.updateMany).not.toHaveBeenCalled();
  });

  // Apex tiers come back with an empty rank string and no division of their own.
  it("maps an apex tier's empty division to I", async () => {
    vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([
      entry({ tier: "CHALLENGER", rank: "" }),
    ] as never);

    await enrichParticipantRanks(MATCH, puuids(1), REGION);

    expect(prisma.matchParticipant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ rankTier: "CHALLENGER", rankDivision: "I" }),
      })
    );
  });
});
