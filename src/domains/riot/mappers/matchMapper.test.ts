import { describe, it, expect } from "vitest";
import { mapMatch } from "./matchMapper";
import type { MatchDTO, ParticipantDTO } from "@/domains/riot/types/riot.types";

const GAME_CREATION = Date.parse("2026-08-20T18:00:00.000Z");

function participant(puuid: string, overrides: Partial<ParticipantDTO> = {}): ParticipantDTO {
  return {
    puuid,
    championId: 103,
    championName: "Ahri",
    teamId: 100,
    teamPosition: "MIDDLE",
    champLevel: 15,
    kills: 7,
    deaths: 3,
    assists: 9,
    totalMinionsKilled: 180,
    neutralMinionsKilled: 20,
    goldEarned: 12000,
    totalDamageDealtToChampions: 21000,
    totalDamageTaken: 15000,
    totalHeal: 3000,
    visionScore: 24,
    wardsPlaced: 10,
    wardsKilled: 3,
    visionWardsBoughtInGame: 2,
    turretKills: 1,
    objectivesStolen: 0,
    firstBloodKill: false,
    win: true,
    timeCCingOthers: 30,
    totalTimeSpentDead: 60,
    item0: 1,
    item1: 2,
    item2: 3,
    item3: 4,
    item4: 5,
    item5: 6,
    item6: 7,
    summoner1Id: 4,
    summoner2Id: 14,
    perks: {
      styles: [
        {
          description: "primaryStyle",
          style: 8100,
          selections: [{ perk: 8112, var1: 0, var2: 0, var3: 0 }],
        },
        { description: "subStyle", style: 8000, selections: [] },
      ],
    },
    ...overrides,
  };
}

function dto(queueId: number, puuids: string[]): MatchDTO {
  return {
    metadata: { matchId: "EUW1_1234567890", participants: puuids },
    info: {
      gameCreation: GAME_CREATION,
      gameDuration: 1800,
      gameEndTimestamp: GAME_CREATION + 1_800_000,
      gameMode: "CLASSIC",
      gameType: "MATCHED_GAME",
      gameVersion: "14.16.1",
      platformId: "EUW1",
      queueId,
      participants: puuids.map((p) => participant(p)),
      teams: [
        {
          teamId: 100,
          win: true,
          objectives: {
            baron: { first: true, kills: 1 },
            dragon: { first: true, kills: 3 },
            inhibitor: { first: false, kills: 1 },
            tower: { first: true, kills: 8 },
            riftHerald: { first: true, kills: 1 },
            champion: { first: true, kills: 30 },
          },
        },
      ],
    },
  };
}

describe("mapMatch", () => {
  it("copies the match's queue and start onto every participant row", () => {
    const mapped = mapMatch(
      dto(420, ["tracked", "other-a", "other-b"]),
      "match-db-id",
      "tracked",
      "account-1"
    );

    expect(mapped).not.toBeNull();
    expect(mapped!.participants).toHaveLength(3);
    for (const p of mapped!.participants) {
      expect(p.queueType).toBe("RANKED_SOLO_5x5");
      expect(p.gameStart).toEqual(new Date(GAME_CREATION));
    }
  });

  // The copy is only sound because it agrees with its source at write time and the source is
  // never rewritten (ADR-040). This pins the first half of that; the second half is a property of
  // the codebase — there is no match.update — and cannot be asserted here.
  it("writes the same queue and start the parent match row gets", () => {
    const mapped = mapMatch(dto(450, ["tracked"]), "match-db-id", "tracked", "account-1");

    expect(mapped!.match.queueType).toBe("ARAM");
    expect(mapped!.participants[0].queueType).toBe(mapped!.match.queueType);
    expect(mapped!.participants[0].gameStart).toEqual(mapped!.match.gameStart);
  });

  it("still refuses a queue it does not track", () => {
    expect(mapMatch(dto(9999, ["tracked"]), "match-db-id", "tracked", "account-1")).toBeNull();
  });
});
