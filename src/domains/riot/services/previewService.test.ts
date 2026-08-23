import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot/services/riotApiClient", () => ({
  getAccountByRiotId: vi.fn(),
  getSummonerByPuuid: vi.fn(),
  getRankedEntriesByPuuidDirect: vi.fn(),
  getMatchIds: vi.fn(),
  getMatch: vi.fn(),
  getChampionMastery: vi.fn(),
}));
vi.mock("@/lib/ddragon/championsData", () => ({ fetchAllChampions: vi.fn() }));
vi.mock("@/lib/ai/aiCache", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getCached: vi.fn(),
  setCached: vi.fn(),
}));

import {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankedEntriesByPuuidDirect,
  getMatchIds,
  getMatch,
  getChampionMastery,
} from "@/domains/riot/services/riotApiClient";
import { getCached, setCached } from "@/lib/ai/aiCache";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { matchFixture } from "./preview/previewFixtures";
import { buildAccountPreview, buildPublicProfile } from "./previewService";

const PUUID = "puuid-1";

const match = () => matchFixture(PUUID);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCached).mockResolvedValue(null);
  vi.mocked(setCached).mockResolvedValue(undefined);
  vi.mocked(getAccountByRiotId).mockResolvedValue({
    puuid: PUUID,
    gameName: "kaanproak0",
    tagLine: "TR1",
  } as never);
  vi.mocked(getSummonerByPuuid).mockResolvedValue({
    summonerLevel: 250,
    profileIconId: 42,
  } as never);
  vi.mocked(getRankedEntriesByPuuidDirect).mockResolvedValue([] as never);
  vi.mocked(getMatchIds).mockResolvedValue(["M1"] as never);
  vi.mocked(getMatch).mockResolvedValue(match() as never);
  vi.mocked(getChampionMastery).mockResolvedValue([] as never);
  vi.mocked(fetchAllChampions).mockResolvedValue([] as never);
});

describe("buildAccountPreview", () => {
  it("builds a preview from Riot data", async () => {
    const result = await buildAccountPreview("kaanproak0", "TR1", "tr1");

    expect(result.summoner.gameName).toBe("kaanproak0");
    expect(result.recentMatches).toHaveLength(1);
    expect(result.topChampions[0]).toMatchObject({ championName: "Ahri", games: 1 });
  });

  it("serves a cache hit without calling Riot", async () => {
    vi.mocked(getCached).mockResolvedValue({ cached: true } as never);

    const result = await buildAccountPreview("kaanproak0", "TR1", "tr1");

    expect(result).toEqual({ cached: true });
    expect(getAccountByRiotId).not.toHaveBeenCalled();
  });

  it("propagates Riot failures so the route can classify them", async () => {
    vi.mocked(getAccountByRiotId).mockRejectedValue(new Error("RIOT_NOT_FOUND"));

    await expect(buildAccountPreview("kaanproak0", "TR1", "tr1")).rejects.toThrow("RIOT_NOT_FOUND");
  });

  /**
   * TASK-285: the cache *read* was guarded but the *write* was not, so a Neon
   * outage threw away a fully built payload and produced a 500. Both cache
   * paths must be non-fatal — the preview is derived entirely from Riot data.
   */
  it("still returns the preview when the cache read fails", async () => {
    vi.mocked(getCached).mockRejectedValue(new Error("Can't reach database server"));

    const result = await buildAccountPreview("kaanproak0", "TR1", "tr1");

    expect(result.summoner.gameName).toBe("kaanproak0");
  });

  it("still returns the preview when the cache write fails", async () => {
    vi.mocked(setCached).mockRejectedValue(new Error("Can't reach database server"));

    const result = await buildAccountPreview("kaanproak0", "TR1", "tr1");

    expect(result.summoner.gameName).toBe("kaanproak0");
    expect(setCached).toHaveBeenCalled();
  });

  /**
   * The landing demo box and the Discord bot share this builder and draw none of the profile
   * page's extras. If they ever start paying for a mastery lookup, the LCP budget in CLAUDE.md
   * §10 is being spent on a strip nobody renders.
   */
  it("does not fetch mastery for the plain preview", async () => {
    await buildAccountPreview("kaanproak0", "TR1", "tr1");

    expect(getChampionMastery).not.toHaveBeenCalled();
  });

  it("drops a match Riot refused to serve rather than failing the whole preview", async () => {
    vi.mocked(getMatchIds).mockResolvedValue(["M1", "M2"] as never);
    vi.mocked(getMatch)
      .mockResolvedValueOnce(match() as never)
      .mockRejectedValueOnce(new Error("RIOT_SERVER_ERROR"));

    const result = await buildAccountPreview("kaanproak0", "TR1", "tr1");

    expect(result.recentMatches).toHaveLength(1);
  });
});

describe("buildPublicProfile", () => {
  it("carries a scoreboard for every match, keyed by match id", async () => {
    const result = await buildPublicProfile("kaanproak0", "TR1", "tr1");

    expect(Object.keys(result.scoreboards)).toEqual(["EUW1_1"]);
    expect(result.scoreboards["EUW1_1"]?.participants).toHaveLength(10);
  });

  it("returns the same rows the plain preview does", async () => {
    const profile = await buildPublicProfile("kaanproak0", "TR1", "tr1");

    expect(profile.recentMatches).toHaveLength(1);
    expect(profile.puuid).toBe(PUUID);
  });

  it("names mastery champions from Data Dragon, richest first", async () => {
    vi.mocked(getChampionMastery).mockResolvedValue([
      { championId: 103, championLevel: 7, championPoints: 100 },
      { championId: 517, championLevel: 5, championPoints: 900 },
    ] as never);
    vi.mocked(fetchAllChampions).mockResolvedValue([
      { key: "103", name: "Ahri" },
      { key: "517", name: "Sylas" },
    ] as never);

    const result = await buildPublicProfile("kaanproak0", "TR1", "tr1");

    expect(result.mastery.map((m) => m.championName)).toEqual(["Sylas", "Ahri"]);
  });

  /** Better a missing strip than numeric champion ids shown to a player. */
  it("drops mastery entries Data Dragon cannot name", async () => {
    vi.mocked(getChampionMastery).mockResolvedValue([
      { championId: 9999, championLevel: 7, championPoints: 100 },
    ] as never);
    vi.mocked(fetchAllChampions).mockResolvedValue([] as never);

    const result = await buildPublicProfile("kaanproak0", "TR1", "tr1");

    expect(result.mastery).toEqual([]);
  });

  /** Two surfaces, two cache keys — a profile hit must not be served the thin preview payload. */
  it("does not read the preview's cache entry", async () => {
    await buildAccountPreview("kaanproak0", "TR1", "tr1");
    const previewKey = vi.mocked(setCached).mock.calls[0]?.[0];
    vi.mocked(setCached).mockClear();

    await buildPublicProfile("kaanproak0", "TR1", "tr1");
    const profileKey = vi.mocked(setCached).mock.calls[0]?.[0];

    expect(profileKey).not.toBe(previewKey);
  });
});
