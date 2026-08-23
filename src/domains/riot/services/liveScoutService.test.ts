import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot/services/riotApiClient", () => ({
  getAccountByRiotId: vi.fn(),
  getAccountByPuuid: vi.fn(),
  getActiveGame: vi.fn(),
  getRankedEntriesByPuuidDirect: vi.fn(),
}));
vi.mock("@/domains/meta", () => ({
  getMetaSnapshot: vi.fn(),
  evaluateDraft: vi.fn(),
  getMatchupData: vi.fn(),
}));

import {
  getAccountByRiotId,
  getAccountByPuuid,
  getActiveGame,
  getRankedEntriesByPuuidDirect,
} from "@/domains/riot/services/riotApiClient";
import { evaluateDraft, getMatchupData, getMetaSnapshot } from "@/domains/meta";
import { buildLiveScout } from "./liveScoutService";

const SUBJECT = "puuid-subject";
const FLASH = 4;
const SMITE = 11;

/** championId → key, and the lane split we pretend the meta snapshot reports. */
const CHAMPIONS = [
  { championId: 1, championKey: "Ahri", position: "MIDDLE" as const },
  { championId: 3, championKey: "LeeSin", position: "JUNGLE" as const },
  { championId: 4, championKey: "Jinx", position: "BOTTOM" as const },
  { championId: 5, championKey: "Thresh", position: "UTILITY" as const },
  { championId: 6, championKey: "Garen", position: "TOP" as const },
];

function snapshot() {
  return {
    champions: CHAMPIONS.map((c) => ({
      championId: c.championId,
      championKey: c.championKey,
      positions: [{ position: c.position, games: 9000 }],
    })),
  };
}

/** Ten players: the subject mid on blue, the same five champions mirrored on red. */
function participants(over: Partial<{ riotId: string }> = {}) {
  const blue = CHAMPIONS.map((c, i) => ({
    puuid: i === 0 ? SUBJECT : `blue-${i}`,
    teamId: 100,
    championId: c.championId,
    spell1Id: c.position === "JUNGLE" ? SMITE : FLASH,
    spell2Id: FLASH,
    ...over,
  }));
  const red = CHAMPIONS.map((c, i) => ({
    puuid: `red-${i}`,
    teamId: 200,
    championId: c.championId,
    spell1Id: c.position === "JUNGLE" ? SMITE : FLASH,
    spell2Id: FLASH,
    ...over,
  }));
  return [...blue, ...red];
}

function game(over: Record<string, unknown> = {}) {
  return {
    gameId: 42,
    gameMode: "CLASSIC",
    gameLength: 600,
    participants: participants(),
    ...over,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getAccountByRiotId).mockResolvedValue({
    puuid: SUBJECT,
    gameName: "kaanproak0",
    tagLine: "TR1",
  } as never);
  vi.mocked(getActiveGame).mockResolvedValue(game() as never);
  vi.mocked(getMetaSnapshot).mockResolvedValue(snapshot() as never);
  vi.mocked(evaluateDraft).mockResolvedValue({ verdict: "Even draft." } as never);
  vi.mocked(getMatchupData).mockResolvedValue({ aWinRateVsB: 52 } as never);
  vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([
    {
      queueType: "RANKED_SOLO_5x5",
      tier: "GOLD",
      rank: "II",
      leaguePoints: 47,
      wins: 20,
      losses: 18,
    },
  ] as never);
  vi.mocked(getAccountByPuuid).mockResolvedValue({
    gameName: "Somebody",
    tagLine: "EUW",
  } as never);
});

describe("buildLiveScout", () => {
  it("reports not-in-game without doing any further work", async () => {
    vi.mocked(getActiveGame).mockResolvedValue(null as never);

    const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

    expect(result).toEqual({ inGame: false });
    expect(getRankedEntriesByPuuidDirect).not.toHaveBeenCalled();
    expect(evaluateDraft).not.toHaveBeenCalled();
  });

  it("returns all ten players with the subject flagged", async () => {
    const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

    if (!result.inGame) throw new Error("expected a live game");
    expect(result.players).toHaveLength(10);
    expect(result.players.filter((p) => p.isSubject)).toHaveLength(1);
    expect(result.players.find((p) => p.isSubject)?.puuid).toBe(SUBJECT);
  });

  it("puts the subject on the side their participant is actually on", async () => {
    const flipped = participants().map((p) => (p.puuid === SUBJECT ? { ...p, teamId: 200 } : p));
    vi.mocked(getActiveGame).mockResolvedValue(game({ participants: flipped }) as never);

    const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

    if (!result.inGame) throw new Error("expected a live game");
    expect(result.yourSide).toBe("red");
  });

  /**
   * The whole reason the page is affordable: names off the spectator payload cost nothing, and
   * account-v1 is only for when Riot does not send them.
   */
  it("takes names from the spectator payload without calling account-v1", async () => {
    vi.mocked(getActiveGame).mockResolvedValue(
      game({ participants: participants({ riotId: "Someone#EUW" }) }) as never
    );

    const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

    if (!result.inGame) throw new Error("expected a live game");
    expect(result.players.every((p) => p.riotId === "Someone#EUW")).toBe(true);
    expect(getAccountByPuuid).not.toHaveBeenCalled();
  });

  it("falls back to account-v1, cached, when the payload carries no name", async () => {
    const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

    if (!result.inGame) throw new Error("expected a live game");
    expect(result.players[0]?.riotId).toBe("Somebody#EUW");
    expect(getAccountByPuuid).toHaveBeenCalledTimes(10);
    // A TTL, so this never becomes the read that hides a rename from the RTBF sweep.
    expect(vi.mocked(getAccountByPuuid).mock.calls[0]?.[2]).toBeGreaterThan(0);
  });

  it("leaves one player unnamed rather than failing the page", async () => {
    vi.mocked(getAccountByPuuid)
      .mockRejectedValueOnce(new Error("RIOT_SERVER_ERROR"))
      .mockResolvedValue({ gameName: "Somebody", tagLine: "EUW" } as never);

    const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

    if (!result.inGame) throw new Error("expected a live game");
    expect(result.players.filter((p) => p.riotId === null)).toHaveLength(1);
    expect(result.players).toHaveLength(10);
  });

  it("leaves one player unranked rather than failing the page", async () => {
    vi.mocked(getRankedEntriesByPuuidDirect)
      .mockRejectedValueOnce(new Error("RIOT_RATE_LIMITED"))
      .mockResolvedValue([] as never);

    const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

    if (!result.inGame) throw new Error("expected a live game");
    expect(result.players.every((p) => p.rank === null)).toBe(true);
  });

  it("reads solo queue and ignores every other queue's entry", async () => {
    vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([
      {
        queueType: "RANKED_FLEX_SR",
        tier: "DIAMOND",
        rank: "I",
        leaguePoints: 99,
        wins: 1,
        losses: 1,
      },
      {
        queueType: "RANKED_SOLO_5x5",
        tier: "GOLD",
        rank: "II",
        leaguePoints: 47,
        wins: 20,
        losses: 18,
      },
    ] as never);

    const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

    if (!result.inGame) throw new Error("expected a live game");
    expect(result.players[0]?.rank).toMatchObject({ tier: "GOLD", division: "II", lp: 47 });
  });

  it("places lanes from Smite and this patch's lane frequencies", async () => {
    const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

    if (!result.inGame) throw new Error("expected a live game");
    expect(result.draft.blue.MIDDLE).toBe("Ahri");
    expect(result.draft.blue.JUNGLE).toBe("LeeSin");
    expect(result.players.find((p) => p.isSubject)?.position).toBe("MIDDLE");
  });

  /**
   * The draft read costs no Riot call, so it must survive the thing that does go wrong — but it
   * cannot survive the meta snapshot being gone, and then the players still matter.
   */
  it("still lists the players when the meta snapshot is unavailable", async () => {
    vi.mocked(getMetaSnapshot).mockResolvedValue(null as never);
    vi.mocked(evaluateDraft).mockResolvedValue(null as never);

    const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

    if (!result.inGame) throw new Error("expected a live game");
    expect(result.players).toHaveLength(10);
    expect(result.evaluation).toBeNull();
    expect(result.players.every((p) => p.position === null)).toBe(true);
  });

  it("reads the subject's own lane against the champion opposing it", async () => {
    await buildLiveScout("kaanproak0", "TR1", "tr1");

    expect(getMatchupData).toHaveBeenCalledWith("Ahri", "Ahri", "MIDDLE");
  });

  /**
   * Riot hides some players in ranked: no puuid, and the *champion* name where the Riot ID goes.
   * Four of ten in the first real game this was tested against. Printing "Karthus" as somebody's
   * name would invent an identity Riot deliberately withheld.
   */
  describe("a player Riot is anonymising", () => {
    const anonymised = () =>
      participants().map((p, i) =>
        i === 1 ? { ...p, puuid: null, riotId: "Karthus" } : { ...p, riotId: `P${i}#EUW` }
      );

    beforeEach(() => {
      vi.mocked(getActiveGame).mockResolvedValue(game({ participants: anonymised() }) as never);
    });

    it("is flagged, unnamed, and never carries the champion as a name", async () => {
      const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

      if (!result.inGame) throw new Error("expected a live game");
      const hidden = result.players.filter((p) => p.anonymous);
      expect(hidden).toHaveLength(1);
      expect(hidden[0]?.riotId).toBeNull();
      expect(result.players.some((p) => p.riotId === "Karthus")).toBe(false);
    });

    it("keeps their champion and lane, which Riot does still give us", async () => {
      const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

      if (!result.inGame) throw new Error("expected a live game");
      const hidden = result.players.find((p) => p.anonymous);
      expect(hidden?.championKey).toBe("LeeSin");
      expect(hidden?.position).toBe("JUNGLE");
    });

    it("costs no Riot call, because there is nothing to look up", async () => {
      await buildLiveScout("kaanproak0", "TR1", "tr1");

      // Nine players, not ten — the hidden one is skipped rather than looked up and failed.
      expect(getRankedEntriesByPuuidDirect).toHaveBeenCalledTimes(9);
      expect(getAccountByPuuid).not.toHaveBeenCalled();
    });

    it("is never mistaken for the searched player", async () => {
      const result = await buildLiveScout("kaanproak0", "TR1", "tr1");

      if (!result.inGame) throw new Error("expected a live game");
      expect(result.players.filter((p) => p.isSubject)).toHaveLength(1);
      expect(result.players.find((p) => p.isSubject)?.anonymous).toBe(false);
    });
  });

  it("propagates a bad Riot ID so the page can render a miss", async () => {
    vi.mocked(getAccountByRiotId).mockRejectedValue(new Error("RIOT_NOT_FOUND"));

    await expect(buildLiveScout("nope", "ZZZZ", "tr1")).rejects.toThrow("RIOT_NOT_FOUND");
  });
});
