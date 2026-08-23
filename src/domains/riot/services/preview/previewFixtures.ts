import type { MatchDTO, ParticipantDTO } from "@/domains/riot/types/riot.types";

/**
 * Test fixtures for the preview mapper and the two builders above it.
 *
 * A real file rather than a `__fixtures__` block inside one spec because two specs need the same
 * ten-player match and a mapper that silently disagrees with the service about the shape of a
 * `MatchDTO` is precisely the bug these tests exist to catch.
 */

export function participantFixture(over: Partial<ParticipantDTO> = {}): ParticipantDTO {
  return {
    puuid: "puuid-filler",
    riotIdGameName: "Filler",
    riotIdTagline: "EUW",
    championId: 517,
    championName: "Sylas",
    teamId: 200,
    teamPosition: "MIDDLE",
    champLevel: 14,
    kills: 3,
    deaths: 7,
    assists: 4,
    totalMinionsKilled: 150,
    neutralMinionsKilled: 10,
    goldEarned: 9_000,
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
    item0: 3020,
    item1: 6653,
    item2: 3157,
    item3: 0,
    item4: 0,
    item5: 0,
    item6: 3340,
    summoner1Id: 4,
    summoner2Id: 14,
    perks: {
      styles: [
        {
          description: "primaryStyle",
          style: 8200,
          selections: [{ perk: 8214, var1: 0, var2: 0, var3: 0 }],
        },
        { description: "subStyle", style: 8100, selections: [] },
      ],
    },
    ...over,
  };
}

interface MatchFixtureOptions {
  matchId?: string;
  queueId?: number;
  gameDuration?: number;
  gameEndTimestamp?: number;
  gameCreation?: number;
  subject?: Partial<ParticipantDTO>;
  /** Omit to get one subject plus nine fillers; pass a list to control the whole lobby. */
  participants?: ParticipantDTO[];
  winningTeam?: number;
}

/** A full ten-player match with the subject on blue side. */
export function matchFixture(
  puuid: string,
  options: MatchFixtureOptions = {}
): MatchDTO {
  const winningTeam = options.winningTeam ?? 100;

  const participants =
    options.participants ??
    [
      participantFixture({
        puuid,
        riotIdGameName: "kaanproak0",
        riotIdTagline: "TR1",
        championId: 103,
        championName: "Ahri",
        teamId: 100,
        kills: 9,
        deaths: 2,
        assists: 11,
        totalMinionsKilled: 200,
        neutralMinionsKilled: 31,
        win: winningTeam === 100,
      }),
      ...Array.from({ length: 4 }, (_, i) =>
        participantFixture({
          puuid: `blue-${i}`,
          teamId: 100,
          kills: 2,
          win: winningTeam === 100,
        })
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        participantFixture({
          puuid: `red-${i}`,
          teamId: 200,
          kills: 3,
          win: winningTeam === 200,
        })
      ),
    ];

  return {
    metadata: {
      matchId: options.matchId ?? "EUW1_1",
      participants: participants.map((p) => p.puuid),
    },
    info: {
      gameCreation: options.gameCreation ?? 1_700_000_000_000,
      gameDuration: options.gameDuration ?? 1_800,
      gameEndTimestamp: options.gameEndTimestamp ?? 1_700_001_800_000,
      gameMode: "CLASSIC",
      gameType: "MATCHED_GAME",
      gameVersion: "16.16.1",
      platformId: "EUW1",
      queueId: options.queueId ?? 420,
      participants: options.subject
        ? [participantFixture({ ...participants[0], ...options.subject }), ...participants.slice(1)]
        : participants,
      teams: [
        { teamId: 100, win: winningTeam === 100, objectives: objectivesFixture() },
        { teamId: 200, win: winningTeam === 200, objectives: objectivesFixture() },
      ],
    },
  };
}

function objectivesFixture(): MatchDTO["info"]["teams"][number]["objectives"] {
  const none = { first: false, kills: 0 };
  return {
    baron: none,
    dragon: none,
    inhibitor: none,
    tower: none,
    riftHerald: none,
    champion: none,
  };
}
