import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    riotAccount: { findUnique: vi.fn() },
    championStat: { findMany: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/domains/riot/services/riotApiClient", () => ({ getChampionMastery: vi.fn() }));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";
import { getChampionMastery } from "@/domains/riot/services/riotApiClient";
import { refreshChampionMastery } from "./championMasteryService";

const ACCOUNT_ID = "8f1c1b2e-0000-4000-8000-000000000001";

function mastery(championId: number, championLevel: number, championPoints: number) {
  return { puuid: "p", championId, championLevel, championPoints, lastPlayTime: 0 };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue({
    puuid: "p",
    region: "tr1",
  } as never);
  vi.mocked(prisma.championStat.update).mockResolvedValue({} as never);
});

describe("refreshChampionMastery", () => {
  it("writes mastery onto the champion rows that exist", async () => {
    vi.mocked(getChampionMastery).mockResolvedValue([mastery(157, 7, 482_310)]);
    vi.mocked(prisma.championStat.findMany).mockResolvedValue([
      { id: "row-1", championId: 157 },
    ] as never);

    const touched = await refreshChampionMastery(ACCOUNT_ID);

    expect(touched).toBe(1);
    expect(prisma.championStat.update).toHaveBeenCalledWith({
      where: { id: "row-1" },
      data: { masteryLevel: 7, masteryPoints: BigInt(482_310) },
    });
  });

  it("does not create rows for champions the player has never played here", async () => {
    // Mastery on three champions, a stat row for one of them.
    vi.mocked(getChampionMastery).mockResolvedValue([
      mastery(157, 7, 482_310),
      mastery(238, 7, 310_442),
      mastery(103, 6, 151_008),
    ]);
    vi.mocked(prisma.championStat.findMany).mockResolvedValue([
      { id: "row-1", championId: 157 },
    ] as never);

    const touched = await refreshChampionMastery(ACCOUNT_ID);

    expect(touched).toBe(1);
    expect(prisma.championStat.update).toHaveBeenCalledTimes(1);
  });

  it("asks only about champions it has mastery for", async () => {
    vi.mocked(getChampionMastery).mockResolvedValue([mastery(157, 7, 1), mastery(238, 5, 2)]);
    vi.mocked(prisma.championStat.findMany).mockResolvedValue([] as never);

    await refreshChampionMastery(ACCOUNT_ID);

    expect(prisma.championStat.findMany).toHaveBeenCalledWith({
      where: { riotAccountId: ACCOUNT_ID, championId: { in: [157, 238] } },
      select: { id: true, championId: true },
    });
  });

  it("is a no-op when Riot returns nothing", async () => {
    vi.mocked(getChampionMastery).mockResolvedValue([]);

    expect(await refreshChampionMastery(ACCOUNT_ID)).toBe(0);
    expect(prisma.championStat.findMany).not.toHaveBeenCalled();
  });

  it("is a no-op for an account that is gone", async () => {
    vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue(null as never);

    expect(await refreshChampionMastery(ACCOUNT_ID)).toBe(0);
    expect(getChampionMastery).not.toHaveBeenCalled();
  });
});
