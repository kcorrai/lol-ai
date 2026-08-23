import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { matchParticipant: { findMany: vi.fn() } },
}));
vi.mock("@/domains/riot/services/accountLookup", () => ({ getAccountPuuid: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import { getChampionBaseline, MIN_BASELINE_GAMES } from "./championBaselineService";

const ACCOUNT_ID = "8f1c1b2e-0000-4000-8000-000000000001";

function played(over: Partial<Record<string, number>> = {}) {
  return { kills: 4, deaths: 5, assists: 6, csPerMinute: 7, visionScore: 20, ...over };
}

/** `n` identical games, which is the shape every average here is taken over. */
function games(n: number, over: Partial<Record<string, number>> = {}) {
  return Array.from({ length: n }, () => played(over));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAccountPuuid).mockResolvedValue("puuid-1");
});

describe("getChampionBaseline", () => {
  it("averages the four metrics a live game can measure", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
      played({ kills: 2, deaths: 4, assists: 6, csPerMinute: 6, visionScore: 18 }),
      played({ kills: 6, deaths: 6, assists: 6, csPerMinute: 8, visionScore: 22 }),
      played({ kills: 4, deaths: 5, assists: 5, csPerMinute: 7, visionScore: 20 }),
      played({ kills: 4, deaths: 5, assists: 5, csPerMinute: 7, visionScore: 20 }),
      played({ kills: 4, deaths: 5, assists: 5, csPerMinute: 7, visionScore: 20 }),
    ] as never);

    const baseline = await getChampionBaseline(ACCOUNT_ID, "Ahri");

    expect(baseline?.games).toBe(5);
    expect(baseline?.csPerMin).toBe(7);
    expect(baseline?.deaths).toBe(5);
    expect(baseline?.visionScore).toBe(20);
  });

  it("averages the per-game KDA rather than dividing the totals", async () => {
    // A game with no deaths is a 6.0, not an infinity, and it must not be flattened by
    // being pooled with the others before the division.
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
      ...games(4, { kills: 1, assists: 1, deaths: 2 }),
      played({ kills: 3, assists: 3, deaths: 0 }),
    ] as never);

    const baseline = await getChampionBaseline(ACCOUNT_ID, "Ahri");

    // Four games at 1.0, one at 6.0 → 2.0
    expect(baseline?.kda).toBe(2);
  });

  it("answers null rather than an average of too few games", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(
      games(MIN_BASELINE_GAMES - 1) as never
    );

    expect(await getChampionBaseline(ACCOUNT_ID, "Ahri")).toBeNull();
  });

  it("answers null when the champion has never been played", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([] as never);

    expect(await getChampionBaseline(ACCOUNT_ID, "Ahri")).toBeNull();
  });

  it("answers null rather than querying on an empty puuid", async () => {
    vi.mocked(getAccountPuuid).mockResolvedValue(null);

    expect(await getChampionBaseline(ACCOUNT_ID, "Ahri")).toBeNull();
    expect(prisma.matchParticipant.findMany).not.toHaveBeenCalled();
  });

  it("reads ranked solo only, newest first, and no further back than the sample", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(games(20) as never);

    await getChampionBaseline(ACCOUNT_ID, "Ahri");

    expect(prisma.matchParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          puuid: "puuid-1",
          championName: "Ahri",
          match: { queueType: "RANKED_SOLO_5x5" },
        },
        orderBy: { match: { gameStart: "desc" } },
        take: 20,
      })
    );
  });
});
