import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot/services/riotApiClient", () => ({
  getAccountByRiotId: vi.fn(),
  getSummonerByPuuid: vi.fn(),
  getRankedEntriesByPuuidDirect: vi.fn(),
  getMatchIds: vi.fn(),
  getMatch: vi.fn(),
}));
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
} from "@/domains/riot/services/riotApiClient";
import { getCached, setCached } from "@/lib/ai/aiCache";
import { buildAccountPreview } from "./previewService";

const PUUID = "puuid-1";

function match(overrides: Partial<{ win: boolean; deaths: number }> = {}) {
  return {
    info: {
      participants: [
        {
          puuid: PUUID,
          championName: "Ahri",
          win: overrides.win ?? true,
          kills: 5,
          deaths: overrides.deaths ?? 2,
          assists: 7,
          teamPosition: "MIDDLE",
        },
      ],
    },
  };
}

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
});
