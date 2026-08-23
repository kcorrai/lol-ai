import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot/services/riotApiClient", () => ({
  getAccountByRiotId: vi.fn(),
  getMatchIds: vi.fn(),
  getMatch: vi.fn(),
}));

import { getLastMatchSummary } from "@/domains/riot/services/lastMatchService";
import { getAccountByRiotId, getMatch, getMatchIds } from "@/domains/riot/services/riotApiClient";
import type { MatchDTO, ParticipantDTO } from "@/domains/riot/types/riot.types";

const PUUID = "puuid-player";

function participant(over: Partial<ParticipantDTO> = {}): ParticipantDTO {
  return {
    puuid: "puuid-other",
    championName: "Sylas",
    championId: 517,
    teamId: 200,
    teamPosition: "MIDDLE",
    champLevel: 14,
    kills: 3,
    deaths: 7,
    assists: 4,
    totalMinionsKilled: 150,
    neutralMinionsKilled: 0,
    goldEarned: 9000,
    totalDamageDealtToChampions: 10_000,
    totalDamageTaken: 20_000,
    totalHeal: 0,
    visionScore: 12,
    wardsPlaced: 5,
    wardsKilled: 1,
    visionWardsBoughtInGame: 1,
    turretKills: 0,
    objectivesStolen: 0,
    firstBloodKill: false,
    win: false,
    timeCCingOthers: 10,
    totalTimeSpentDead: 100,
    item0: 0,
    item1: 0,
    item2: 0,
    item3: 0,
    item4: 0,
    item5: 0,
    item6: 3340,
    summoner1Id: 4,
    summoner2Id: 14,
    perks: { styles: [] },
    ...over,
  };
}

function matchDto(over: { gameDuration?: number; queueId?: number } = {}): MatchDTO {
  const player = participant({
    puuid: PUUID,
    riotIdGameName: "Faker",
    riotIdTagline: "KR1",
    championName: "Ahri",
    teamId: 100,
    kills: 9,
    deaths: 2,
    assists: 11,
    totalMinionsKilled: 200,
    neutralMinionsKilled: 31,
    goldEarned: 13_400,
    totalDamageDealtToChampions: 24_500,
    visionScore: 21,
    win: true,
    item0: 6653,
    item1: 3020,
    item2: 0,
    item3: 3157,
    item4: 0,
    item5: 0,
  });

  return {
    metadata: { matchId: "KR_1", participants: [PUUID] },
    info: {
      gameCreation: 0,
      gameDuration: over.gameDuration ?? 1471, // 24:31
      gameEndTimestamp: 1_750_000_000_000,
      gameMode: "CLASSIC",
      gameType: "MATCHED_GAME",
      gameVersion: "14.1.1",
      platformId: "KR",
      queueId: over.queueId ?? 420,
      participants: [
        player,
        // A teammate, so damage share is a share of something.
        participant({ puuid: "mate", teamId: 100, totalDamageDealtToChampions: 25_500 }),
        participant(),
      ],
      teams: [],
    },
  };
}

describe("getLastMatchSummary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getAccountByRiotId).mockResolvedValue({
      puuid: PUUID,
      gameName: "Faker",
      tagLine: "KR1",
    });
    vi.mocked(getMatchIds).mockResolvedValue(["KR_1"]);
    vi.mocked(getMatch).mockResolvedValue(matchDto());
  });

  it("asks Riot for exactly one match", async () => {
    await getLastMatchSummary("Faker", "KR1", "kr");

    expect(getMatchIds).toHaveBeenCalledWith(PUUID, "kr", 1);
  });

  it("derives CS per minute, damage share and the finished build", async () => {
    const summary = await getLastMatchSummary("Faker", "KR1", "kr");

    expect(summary).not.toBeNull();
    expect(summary?.cs).toBe(231);
    expect(summary?.csPerMinute).toBe(9.4);
    expect(summary?.kda).toBe(10);
    // 24500 of the team's 50000.
    expect(summary?.damageShare).toBeCloseTo(0.49, 2);
    // Empty slots are dropped rather than reported as item 0.
    expect(summary?.items).toEqual([6653, 3020, 3157]);
    expect(summary?.queue).toBe("RANKED_SOLO_5x5");
    expect(summary?.win).toBe(true);
  });

  it("identifies the lane opponent by position on the other team", async () => {
    const summary = await getLastMatchSummary("Faker", "KR1", "kr");

    expect(summary?.opponent).toEqual({
      championName: "Sylas",
      position: "MIDDLE",
      riotId: "Sylas",
    });
  });

  it("flags a remake so the card can suppress meaningless stats", async () => {
    vi.mocked(getMatch).mockResolvedValue(matchDto({ gameDuration: 240 }));

    expect((await getLastMatchSummary("Faker", "KR1", "kr"))?.remake).toBe(true);
  });

  it("falls back to the raw game mode for a queue it does not know", async () => {
    vi.mocked(getMatch).mockResolvedValue(matchDto({ queueId: 9999 }));

    expect((await getLastMatchSummary("Faker", "KR1", "kr"))?.queue).toBe("CLASSIC");
  });

  it("returns null for an account with no match history", async () => {
    vi.mocked(getMatchIds).mockResolvedValue([]);

    await expect(getLastMatchSummary("Faker", "KR1", "kr")).resolves.toBeNull();
    expect(getMatch).not.toHaveBeenCalled();
  });
});
