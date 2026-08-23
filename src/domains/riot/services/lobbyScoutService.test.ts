import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot/services/riotApiClient", () => ({
  getAccountByRiotId: vi.fn(),
  getSummonerByPuuid: vi.fn(),
  getRankedEntriesByPuuidDirect: vi.fn(),
  getChampionMastery: vi.fn(),
}));
vi.mock("@/lib/ddragon/championsData", () => ({ fetchAllChampions: vi.fn() }));

import {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankedEntriesByPuuidDirect,
  getChampionMastery,
} from "@/domains/riot/services/riotApiClient";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { buildLobbyScout } from "./lobbyScoutService";
import { extractRiotIds } from "./riotIds";

const LOBBY = extractRiotIds("Faker#KR1, kaanproak0#TR1");

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getAccountByRiotId).mockImplementation(
    async (gameName: string) => ({ puuid: `puuid-${gameName}`, gameName, tagLine: "X" }) as never
  );
  vi.mocked(getSummonerByPuuid).mockResolvedValue({
    summonerLevel: 250,
    profileIconId: 42,
  } as never);
  vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([
    {
      queueType: "RANKED_SOLO_5x5",
      tier: "GOLD",
      rank: "II",
      leaguePoints: 47,
      wins: 60,
      losses: 40,
    },
  ] as never);
  vi.mocked(getChampionMastery).mockResolvedValue([
    { championId: 103, championLevel: 7, championPoints: 100_000 },
    { championId: 517, championLevel: 5, championPoints: 900 },
    { championId: 1, championLevel: 4, championPoints: 500 },
    { championId: 2, championLevel: 3, championPoints: 100 },
  ] as never);
  vi.mocked(fetchAllChampions).mockResolvedValue([
    { key: "103", name: "Ahri" },
    { key: "517", name: "Sylas" },
    { key: "1", name: "Annie" },
    { key: "2", name: "Olaf" },
  ] as never);
});

describe("buildLobbyScout", () => {
  it("scouts every pasted player", async () => {
    const result = await buildLobbyScout(LOBBY, "euw1");

    expect(result.players.map((p) => p.riotId)).toEqual(["Faker#KR1", "kaanproak0#TR1"]);
    expect(result.players.every((p) => p.found)).toBe(true);
  });

  it("carries level, rank and win rate", async () => {
    const [player] = (await buildLobbyScout(LOBBY, "euw1")).players;

    expect(player.summonerLevel).toBe(250);
    expect(player.rank).toMatchObject({ tier: "GOLD", division: "II", lp: 47, winRate: 60 });
  });

  it("shows the three biggest mastery champions, named and richest first", async () => {
    const [player] = (await buildLobbyScout(LOBBY, "euw1")).players;

    expect(player.mastery.map((m) => m.championName)).toEqual(["Ahri", "Sylas", "Annie"]);
  });

  /**
   * A typo'd Riot ID in a paste of ten is the normal case, not an exception. It costs that row,
   * never the page — a lobby where one name was mistyped is still worth scouting.
   */
  it("marks an unknown player not-found and keeps scouting the rest", async () => {
    vi.mocked(getAccountByRiotId).mockImplementation(async (gameName: string) => {
      if (gameName === "Faker") throw new Error("RIOT_NOT_FOUND");
      return { puuid: "puuid-ok", gameName, tagLine: "X" } as never;
    });

    const result = await buildLobbyScout(LOBBY, "euw1");

    expect(result.players[0]).toMatchObject({ found: false, rank: null, mastery: [] });
    expect(result.players[1]).toMatchObject({ found: true });
  });

  it("keeps a player whose rank lookup failed, rather than losing them", async () => {
    vi.mocked(getRankedEntriesByPuuidDirect).mockRejectedValue(new Error("RIOT_RATE_LIMITED"));

    const result = await buildLobbyScout(LOBBY, "euw1");

    expect(result.players.every((p) => p.found)).toBe(true);
    expect(result.players.every((p) => p.rank === null)).toBe(true);
  });

  it("reads solo queue and ignores flex", async () => {
    vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([
      {
        queueType: "RANKED_FLEX_SR",
        tier: "DIAMOND",
        rank: "I",
        leaguePoints: 99,
        wins: 1,
        losses: 1,
      },
    ] as never);

    const [player] = (await buildLobbyScout(LOBBY, "euw1")).players;

    expect(player.rank).toBeNull();
  });

  it("reports an unranked player as found but rankless", async () => {
    vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([] as never);

    const [player] = (await buildLobbyScout(LOBBY, "euw1")).players;

    expect(player).toMatchObject({ found: true, rank: null });
  });

  /** Ten players share one catalogue rather than fetching it ten times. */
  it("looks the champion catalogue up once for the whole lobby", async () => {
    await buildLobbyScout(LOBBY, "euw1");

    expect(fetchAllChampions).toHaveBeenCalledTimes(1);
  });

  it("still lists players when the champion catalogue is unavailable", async () => {
    vi.mocked(fetchAllChampions).mockRejectedValue(new Error("ddragon down"));

    const result = await buildLobbyScout(LOBBY, "euw1");

    expect(result.players.every((p) => p.found)).toBe(true);
    expect(result.players.every((p) => p.mastery.length === 0)).toBe(true);
  });

  it("is empty for an empty paste, without calling Riot", async () => {
    const result = await buildLobbyScout([], "euw1");

    expect(result.players).toEqual([]);
    expect(getAccountByRiotId).not.toHaveBeenCalled();
  });
});
