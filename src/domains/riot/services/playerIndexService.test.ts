import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    playerIndex: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";
import { indexPlayers, searchPlayers } from "@/domains/riot/services/playerIndexService";

function participant(gameName: string | null, puuid = `puuid-${gameName}`) {
  return { puuid, gameName, tagLine: gameName === null ? null : "EUW", region: "euw1" };
}

interface CreatedRow {
  puuid: string;
  gameName: string;
  searchKey: string;
  seenCount: number;
}

/** The rows handed to the single `createMany`, or a failure if it was never called. */
function createdRows(): CreatedRow[] {
  const [args] = vi.mocked(prisma.playerIndex.createMany).mock.calls[0] ?? [];
  if (!args) throw new Error("createMany was not called");
  return args.data as CreatedRow[];
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.playerIndex.findMany).mockResolvedValue([]);
  vi.mocked(prisma.playerIndex.createMany).mockResolvedValue({ count: 0 } as never);
  vi.mocked(prisma.playerIndex.updateMany).mockResolvedValue({ count: 0 } as never);
});

describe("indexPlayers", () => {
  it("writes one row per player and creates it with a zero count", async () => {
    const written = await indexPlayers([participant("Faker"), participant("Chovy")]);

    expect(written).toBe(2);
    const created = createdRows();
    expect(created.map((c) => c.gameName).sort()).toEqual(["Chovy", "Faker"]);
    // Zero on create, because the increment below covers new and existing rows alike.
    expect(created.every((c) => c.seenCount === 0)).toBe(true);
    expect(created.map((c) => c.searchKey).sort()).toEqual(["chovy", "faker"]);
  });

  it("counts repeat appearances instead of collapsing them to one", async () => {
    // Faker was in three of the matches just synced, Chovy in one.
    await indexPlayers([
      participant("Faker"),
      participant("Faker"),
      participant("Faker"),
      participant("Chovy"),
    ]);

    const increments = vi
      .mocked(prisma.playerIndex.updateMany)
      .mock.calls.map((call) => call[0] as { where: { puuid: { in: string[] } }; data: { seenCount: { increment: number } } });

    const byPuuid = new Map<string, number>();
    for (const call of increments) {
      for (const puuid of call.where.puuid.in) byPuuid.set(puuid, call.data.seenCount.increment);
    }
    expect(byPuuid.get("puuid-Faker")).toBe(3);
    expect(byPuuid.get("puuid-Chovy")).toBe(1);
  });

  it("groups players by appearance count rather than issuing one statement each", async () => {
    await indexPlayers([
      participant("A"),
      participant("B"),
      participant("C"),
      participant("D"),
    ]);

    // Four players, all seen once — one statement, not four.
    expect(prisma.playerIndex.updateMany).toHaveBeenCalledTimes(1);
  });

  it("skips a participant with no Riot ID, which could never be searched for", async () => {
    const written = await indexPlayers([participant("Faker"), participant(null, "puuid-anon")]);

    expect(written).toBe(1);
    expect(createdRows().map((c) => c.puuid)).toEqual(["puuid-Faker"]);
  });

  it("rewrites the stored name only for a player who has renamed", async () => {
    vi.mocked(prisma.playerIndex.findMany).mockResolvedValue([
      { puuid: "puuid-Faker", gameName: "OldName", tagLine: "EUW", region: "euw1" },
      { puuid: "puuid-Chovy", gameName: "Chovy", tagLine: "EUW", region: "euw1" },
    ] as never);

    await indexPlayers([participant("Faker"), participant("Chovy")]);

    expect(prisma.playerIndex.update).toHaveBeenCalledTimes(1);
    expect(prisma.playerIndex.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { puuid: "puuid-Faker" },
        data: expect.objectContaining({ gameName: "Faker", searchKey: "faker" }),
      }),
    );
  });

  it("does nothing on an empty batch", async () => {
    expect(await indexPlayers([])).toBe(0);
    expect(prisma.playerIndex.createMany).not.toHaveBeenCalled();
  });

  it("swallows a database failure — a sync must not fail over search coverage", async () => {
    vi.mocked(prisma.playerIndex.findMany).mockRejectedValue(new Error("connection lost"));

    await expect(indexPlayers([participant("Faker")])).resolves.toBe(0);
  });
});

describe("searchPlayers", () => {
  it("does not hit the database for a query too short to narrow anything", async () => {
    expect(await searchPlayers("f")).toEqual([]);
    expect(prisma.playerIndex.findMany).not.toHaveBeenCalled();
  });

  it("matches the name as a prefix and the tag only when one was typed", async () => {
    await searchPlayers("Faker", { region: "kr" });
    expect(prisma.playerIndex.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { searchKey: { startsWith: "faker" }, region: "kr" },
      }),
    );

    await searchPlayers("Faker#KR1");
    expect(prisma.playerIndex.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          searchKey: { startsWith: "faker" },
          tagLine: { startsWith: "kr1", mode: "insensitive" },
        },
      }),
    );
  });
});
