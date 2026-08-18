// Riot API response shapes — read-only DTOs, never stored directly
// All field names match the Riot API exactly (some use camelCase, some snake_case)

export interface RiotAccountDTO {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface SummonerDTO {
  id: string; // summonerId
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

/**
 * Champion mastery — the only signal Riot serves that predates our match window.
 * match-v5 keeps roughly two years; mastery points have been accumulating since the
 * account was made, which is what makes them worth a request on a career page.
 */
export interface ChampionMasteryDTO {
  puuid: string;
  championId: number;
  championLevel: number;
  championPoints: number;
  /** Epoch milliseconds. Riot gives no *first* play, only the most recent one. */
  lastPlayTime: number;
}

export interface RankedEntryDTO {
  leagueId: string;
  summonerId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  freshBlood: boolean;
  hotStreak: boolean;
  veteran: boolean;
  inactive: boolean;
}

export interface MatchDTO {
  metadata: {
    matchId: string;
    participants: string[]; // PUUIDs of all 10 players
  };
  info: {
    gameCreation: number; // Unix ms
    gameDuration: number; // seconds (post-2021 patch)
    gameEndTimestamp: number;
    gameMode: string;
    gameType: string;
    gameVersion: string;
    platformId: string; // e.g. "EUW1"
    queueId: number;
    participants: ParticipantDTO[];
    teams: TeamDTO[];
  };
}

interface ObjectiveDTO {
  first: boolean;
  kills: number;
}

export interface TeamDTO {
  teamId: number; // 100 = blue, 200 = red
  win: boolean;
  objectives: {
    baron:      ObjectiveDTO;
    dragon:     ObjectiveDTO;
    inhibitor:  ObjectiveDTO;
    tower:      ObjectiveDTO;
    riftHerald: ObjectiveDTO;
    champion:   ObjectiveDTO;
  };
}

export interface ParticipantDTO {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  championId: number;
  championName: string;
  teamId: number;
  teamPosition: string; // "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY" | ""
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  totalHeal: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  visionWardsBoughtInGame: number; // control wards
  turretKills: number;
  objectivesStolen: number;
  firstBloodKill: boolean;
  win: boolean;
  timeCCingOthers: number;
  totalTimeSpentDead: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number; // trinket/ward
  summoner1Id: number;
  summoner2Id: number;
  perks: {
    styles: Array<{
      description: string;
      style: number;
      selections: Array<{ perk: number; var1: number; var2: number; var3: number }>;
    }>;
  };
}

// MatchTimeline — only the fields we parse (CHAMPION_KILL events)
export interface MatchTimelineDTO {
  info: {
    frameInterval: number;
    participants: Array<{ participantId: number; puuid: string }>;
    frames: Array<{
      timestamp: number;
      events: MatchTimelineEvent[];
    }>;
  };
}

export type MatchTimelineEvent =
  | {
      type: "CHAMPION_KILL";
      timestamp: number;
      killerId: number;
      victimId: number;
      position: { x: number; y: number };
    }
  | { type: string; [key: string]: unknown };
