import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    matchParticipant: { findMany: vi.fn() },
    duoPartner: { findFirst: vi.fn(), updateMany: vi.fn(), upsert: vi.fn() },
  },
}));
vi.mock("@/domains/riot", () => ({ getAccountPuuid: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot";
import { getActiveDuo, getDuoCandidates } from "@/domains/analysis/services/duoService";

const ACCOUNT_ID = "acc-1";
const CURRENT_PUUID = "puuid-current";
const OLD_PUUID = "puuid-before-riot-reissued-it";

/** The account's own rows, spanning a PUUID change, plus the teammates in those matches. */
function history(): void {
  vi.mocked(prisma.matchParticipant.findMany)
    .mockResolvedValueOnce([
      {
        matchId: "m1",
        teamId: 100,
        puuid: CURRENT_PUUID,
        match: { gameStart: new Date(2026, 0, 2) },
      },
      { matchId: "m2", teamId: 100, puuid: OLD_PUUID, match: { gameStart: new Date(2026, 0, 1) } },
    ] as never)
    .mockResolvedValueOnce([
      {
        matchId: "m1",
        teamId: 100,
        puuid: "puuid-mate",
        gameName: "Mate",
        tagLine: "TR1",
        won: true,
      },
      {
        matchId: "m2",
        teamId: 100,
        puuid: "puuid-mate",
        gameName: "Mate",
        tagLine: "TR1",
        won: false,
      },
      {
        matchId: "m1",
        teamId: 100,
        puuid: "puuid-mate",
        gameName: "Mate",
        tagLine: "TR1",
        won: true,
      },
    ] as never);
}

function whereOfCall(index: number): Record<string, unknown> {
  const call = vi.mocked(prisma.matchParticipant.findMany).mock.calls[index];
  if (!call) throw new Error(`findMany was not called ${index + 1} times`);
  return (call[0] as { where: Record<string, unknown> }).where;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getAccountPuuid).mockResolvedValue(CURRENT_PUUID);
});

describe("getDuoCandidates", () => {
  it("selects the account's rows by account id as well as puuid", async () => {
    history();

    await getDuoCandidates(ACCOUNT_ID);

    // Account id alone misses rows synced before linking; puuid alone misses rows left behind by
    // a PUUID reissue. On real data the second case was five matches in a hundred.
    expect(whereOfCall(0)).toEqual({
      OR: [{ riotAccountId: ACCOUNT_ID }, { puuid: CURRENT_PUUID }],
    });
  });

  it("excludes every PUUID the account has used, so it never ranks the player as their own duo", async () => {
    history();

    await getDuoCandidates(ACCOUNT_ID);

    expect(whereOfCall(1)).toEqual({
      matchId: { in: ["m1", "m2"] },
      puuid: { notIn: [CURRENT_PUUID, OLD_PUUID] },
    });
  });

  it("excludes by a list rather than by negating a nullable column", async () => {
    history();

    await getDuoCandidates(ACCOUNT_ID);

    // The other nine participants have a null riotAccountId, and `NOT (NULL OR false)` is NULL in
    // SQL — that form silently returned no teammates at all.
    expect(whereOfCall(1)).not.toHaveProperty("NOT");
  });

  it("returns nothing when the account has no synced matches", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValueOnce([] as never);

    expect(await getDuoCandidates(ACCOUNT_ID)).toEqual([]);
    expect(prisma.matchParticipant.findMany).toHaveBeenCalledTimes(1);
  });
});

describe("getActiveDuo", () => {
  it("narrows the second query to the partner instead of excluding the player", async () => {
    vi.mocked(prisma.duoPartner.findFirst).mockResolvedValue({
      puuid: "puuid-mate",
      gameName: "Mate",
      tagLine: "TR1",
    } as never);
    history();

    await getActiveDuo(ACCOUNT_ID);

    expect(whereOfCall(1)).toEqual({ matchId: { in: ["m1", "m2"] }, puuid: "puuid-mate" });
  });

  it("is null when no duo has been marked, without touching match history", async () => {
    vi.mocked(prisma.duoPartner.findFirst).mockResolvedValue(null as never);

    expect(await getActiveDuo(ACCOUNT_ID)).toBeNull();
    expect(prisma.matchParticipant.findMany).not.toHaveBeenCalled();
  });
});
