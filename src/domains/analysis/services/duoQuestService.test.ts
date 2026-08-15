import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { duoQuest: { findMany: vi.fn() }, $transaction: vi.fn() },
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/domains/analysis/services/duoService", () => ({ getActiveDuo: vi.fn() }));
vi.mock("@/domains/analysis/services/duoMatchLoader", () => ({
  loadDuoMatches: vi.fn(),
  sharedOnly: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { getActiveDuo } from "@/domains/analysis/services/duoService";
import { loadDuoMatches, sharedOnly } from "@/domains/analysis/services/duoMatchLoader";
import { questsForWeek, weekWindow } from "@/domains/analysis/services/duoQuestCatalog";
import { getDuoQuests } from "@/domains/analysis/services/duoQuestService";

const ACCOUNT_ID = "acc-1";
const NOW = new Date("2026-08-13T18:00:00Z"); // a Thursday
const WEEK = weekWindow(NOW);
const PARTNER = { puuid: "puuid-mate", gameName: "Mate", tagLine: "TR1", games: 20 };

/** Stands in for the client Prisma hands the interactive-transaction callback. */
function fakeTx() {
  return {
    duoQuest: { upsert: vi.fn().mockResolvedValue({}) },
    riotAccount: { findUnique: vi.fn().mockResolvedValue({ userId: "user-1" }) },
    user: { update: vi.fn().mockResolvedValue({}) },
  };
}

function sharedGames(count: number, won = true): void {
  vi.mocked(sharedOnly).mockReturnValue(
    Array.from({ length: count }, (_, i) => ({
      matchId: `m${i}`,
      teamId: 100,
      gameStart: new Date(2026, 7, 11 + i),
      won,
      championName: "Ahri",
      position: "MIDDLE",
      kills: 5,
      deaths: 2,
      assists: 8,
      visionScore: 30,
      csPerMinute: 7,
    })),
  );
}

let tx: ReturnType<typeof fakeTx>;

beforeEach(() => {
  vi.resetAllMocks();
  tx = fakeTx();
  vi.mocked(getActiveDuo).mockResolvedValue(PARTNER as never);
  vi.mocked(loadDuoMatches).mockResolvedValue({ own: [], partner: [] });
  vi.mocked(prisma.duoQuest.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.$transaction).mockImplementation(
    (fn) => (fn as unknown as (t: unknown) => Promise<unknown>)(tx) as never,
  );
  sharedGames(0);
});

describe("getDuoQuests", () => {
  it("is null when no duo is marked, without loading any matches", async () => {
    vi.mocked(getActiveDuo).mockResolvedValue(null);

    expect(await getDuoQuests(ACCOUNT_ID, NOW)).toBeNull();
    expect(loadDuoMatches).not.toHaveBeenCalled();
  });

  it("only counts games inside this week", async () => {
    await getDuoQuests(ACCOUNT_ID, NOW);

    expect(loadDuoMatches).toHaveBeenCalledWith(ACCOUNT_ID, PARTNER.puuid, { since: WEEK.start });
  });

  it("serves the week's quests with progress read off the shared games", async () => {
    sharedGames(2);

    const result = await getDuoQuests(ACCOUNT_ID, NOW);

    expect(result!.quests.map((q) => q.key)).toEqual(questsForWeek(WEEK.start).map((q) => q.key));
    expect(result!.weekStart).toBe(WEEK.start.toISOString());
  });

  it("caps progress at the target so the panel never renders 7 / 5", async () => {
    sharedGames(20);

    const result = await getDuoQuests(ACCOUNT_ID, NOW);

    for (const q of result!.quests) {
      expect(q.progress).toBeLessThanOrEqual(q.target);
    }
  });

  it("pays XP on the same transaction as the completion", async () => {
    sharedGames(20);

    const result = await getDuoQuests(ACCOUNT_ID, NOW);
    const completed = result!.quests.filter((q) => q.completed);

    expect(completed.length).toBeGreaterThan(0);
    expect(tx.user.update).toHaveBeenCalledTimes(completed.length);
    expect(result!.xpAwarded).toBe(completed.reduce((sum, q) => sum + q.xpReward, 0));
  });

  it("does not pay again for a quest already marked complete", async () => {
    sharedGames(20);
    const keys = questsForWeek(WEEK.start).map((q) => q.key);
    vi.mocked(prisma.duoQuest.findMany).mockResolvedValue(
      keys.map((key) => ({ key, completed: true })) as never,
    );

    const result = await getDuoQuests(ACCOUNT_ID, NOW);

    // Refreshing the panel must not be an XP button.
    expect(result!.xpAwarded).toBe(0);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(result!.quests.every((q) => q.completed)).toBe(true);
  });

  it("writes one row per quest, keyed so a second read cannot duplicate it", async () => {
    await getDuoQuests(ACCOUNT_ID, NOW);

    expect(tx.duoQuest.upsert).toHaveBeenCalledTimes(3);
    expect(tx.duoQuest.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          riotAccountId_partnerPuuid_key_periodStart: expect.objectContaining({
            riotAccountId: ACCOUNT_ID,
            partnerPuuid: PARTNER.puuid,
            periodStart: WEEK.start,
          }),
        },
      }),
    );
  });

  it("still reports progress when the write fails", async () => {
    sharedGames(20);
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("connection lost"));

    const result = await getDuoQuests(ACCOUNT_ID, NOW);

    // A bookkeeping row is not worth failing the panel over.
    expect(result!.quests.some((q) => q.completed)).toBe(true);
  });
});
