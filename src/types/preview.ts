import type { ParticipantDetail } from "@/domains/match";

/**
 * One row of the public profile's match list.
 *
 * Everything here comes out of the same `MatchDTO` the preview already fetches — the payload grew
 * (TASK-LA-69) because the public profile used to show six fields off a response that carried a
 * hundred, and next to op.gg that reads as a demo. No extra Riot call pays for any of it.
 */
export interface PreviewMatch {
  /** Riot match id, e.g. "EUW1_1234567890". Keys the scoreboard map and the list's React keys. */
  matchId: string;
  /** Prisma `QueueType` name, or null for a queue we do not label (see QUEUE_MAP). */
  queueType: string | null;
  gameDurationSeconds: number;
  /** ISO timestamp of the game's end, for the "3h ago" stamp. */
  gameEndedAt: string;
  championId: number;
  championName: string;
  champLevel: number;
  win: boolean;
  position: string;
  kills: number;
  deaths: number;
  assists: number;
  /** Minions + neutral monsters, the number every stats site calls "CS". */
  cs: number;
  csPerMinute: number;
  visionScore: number;
  goldEarned: number;
  damageDealt: number;
  /** 0-1 fraction, matching `computeKillParticipation` — the UI multiplies by 100. */
  killParticipation: number;
  /** The six inventory slots, trinket excluded — mirrors what the scoreboard renders. */
  itemIds: number[];
  trinketId: number;
  summonerSpell1: number;
  summonerSpell2: number;
  runePrimaryKeystone: number | null;
  runePrimaryPath: number | null;
  runeSecondaryPath: number | null;
}

export interface PreviewChampion {
  championName: string;
  games: number;
  wins: number;
  winRate: number;
}

export interface PreviewResponse {
  summoner: {
    gameName: string;
    tagLine: string;
    summonerLevel: number;
    profileIconId: number;
  };
  rank: {
    tier: string;
    division: string;
    lp: number;
    wins: number;
    losses: number;
  } | null;
  recentMatches: PreviewMatch[];
  topChampions: PreviewChampion[];
  aiInsight: string;
}

/** A champion the account has mastery on, richest first. */
export interface PreviewMastery {
  championId: number;
  championName: string;
  championLevel: number;
  championPoints: number;
}

/**
 * The ten-player scoreboard behind one match row.
 *
 * Shaped as `ParticipantDetail` so `MatchScoreboard` renders it unchanged — the type is a plain
 * view-model, not a Prisma row. `rankTier`/`rankDivision`/`rankLp` are always null here: filling
 * them would cost ten ranked-entry calls per expanded match, and the component already renders a
 * dash for an unknown rank.
 */
export interface PreviewScoreboard {
  participants: ParticipantDetail[];
  winningTeam: number;
}

/**
 * What the public profile page renders: the preview, plus the two things only that page needs.
 *
 * Kept separate from `PreviewResponse` because the landing demo box and the Discord bot share
 * `buildAccountPreview` and must not start paying for scoreboards they never draw.
 */
export interface PublicProfileResponse extends PreviewResponse {
  puuid: string;
  mastery: PreviewMastery[];
  /** Keyed by `PreviewMatch.matchId`. */
  scoreboards: Record<string, PreviewScoreboard>;
}
