// Our shapes for the esports section. Deliberately not the feed's: the upstream
// payload differs between endpoints for the same entity (see EsportsEventTeam),
// and pinning our types to it would spread that inconsistency through the UI.

export type EventState = "unstarted" | "inProgress" | "completed";
export type MatchOutcome = "win" | "loss";

// How prominently Riot's own client lists a league. `hidden` is not "defunct" —
// some real leagues sit there — so it lowers a league's rank rather than
// excluding it.
export type LeagueDisplayStatus = "force_selected" | "selected" | "not_selected" | "hidden";

export interface EsportsLeague {
  id: string;
  slug: string;
  name: string;
  /** Upstream region string, e.g. "INTERNATIONAL", "KOREA", "NORTH AMERICA". */
  region: string;
  image: string | null;
  displayStatus: LeagueDisplayStatus;
  /** Position within the display status band. Lower sorts first. */
  displayPosition: number;
}

export interface EsportsTournament {
  id: string;
  slug: string;
  /** YYYY-MM-DD, as published. Not every tournament has both bounds. */
  startDate: string | null;
  endDate: string | null;
  leagueId: string;
}

export interface EsportsEventTeam {
  /**
   * `getSchedule` returns teams as name/code/image only, while `getLive` and
   * `getEventDetails` also carry id and slug. Both are therefore optional here,
   * and anything that needs to link to a team page resolves the slug through
   * the team index instead of trusting this field.
   */
  id: string | null;
  slug: string | null;
  name: string;
  code: string;
  image: string | null;
  /** Games won in this series so far. */
  gameWins: number;
  outcome: MatchOutcome | null;
  /** Season record at the time of the match, when the feed provides it. */
  record: { wins: number; losses: number } | null;
}

export interface EsportsEventLeague {
  /** Absent from the lean `getSchedule` payload; the slug is always present. */
  id: string | null;
  slug: string;
  name: string;
  image: string | null;
}

export interface GameParticipant {
  /** 1-5 blue, 6-10 red. */
  participantId: number;
  playerId: string | null;
  /** Handle with the team prefix stripped: "PerfecT", not "KT PerfecT". */
  handle: string;
  fullHandle: string;
  /** Data Dragon champion id, e.g. "MissFortune". */
  championId: string;
  role: PlayerRole | null;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  gold: number;
  /** Fractions 0-1, or null when the details feed has no data for this game. */
  killParticipation: number | null;
  damageShare: number | null;
  wardsPlaced: number | null;
  items: number[];
  runes: { primaryStyle: number; secondaryStyle: number; perks: number[] } | null;
}

export interface GameTeamStats {
  side: "blue" | "red";
  teamId: string | null;
  gold: number;
  kills: number;
  towers: number;
  inhibitors: number;
  barons: number;
  /** Dragon types taken, in order: "ocean", "infernal", … */
  dragons: string[];
  participants: GameParticipant[];
}

export interface GameStats {
  gameId: string;
  /** Two-part patch, e.g. "15.20". */
  patch: string;
  finished: boolean;
  lastFrameAt: string;
  blue: GameTeamStats;
  red: GameTeamStats;
}

export interface MatchGameRef {
  number: number;
  id: string;
  /** "completed", "inProgress", "unstarted", "unneeded". */
  state: string;
  /** Team id → side, when the feed has decided sides. */
  blueTeamId: string | null;
  redTeamId: string | null;
  hasVod: boolean;
}

export interface MatchDetail {
  matchId: string;
  bestOf: number | null;
  league: { id: string | null; slug: string | null; name: string; image: string | null };
  tournamentId: string | null;
  teams: {
    id: string;
    name: string;
    code: string;
    image: string | null;
    gameWins: number;
  }[];
  games: MatchGameRef[];
}

export interface PlayerEntry {
  /** URL slug: the handle, suffixed with the team code only when it collides. */
  slug: string;
  player: EsportsPlayer;
  team: EsportsTeam;
}

export interface PlayerGame {
  matchId: string;
  gameId: string;
  gameNumber: number;
  playerId: string | null;
  handle: string;
  championId: string;
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
}

export interface PlayerChampionStat {
  championId: string;
  games: number;
  kills: number;
  deaths: number;
  assists: number;
}

export type PlayerRole = "top" | "jungle" | "mid" | "bottom" | "support";
export type TeamStatus = "active" | "archived";

export interface EsportsPlayer {
  id: string;
  /** In-game handle — "Faker", "Caps". What people search for. */
  handle: string;
  /** Real name, when the feed has one. */
  fullName: string | null;
  image: string | null;
  /** Null for staff, substitutes with no lane, and anything unrecognised. */
  role: PlayerRole | null;
}

export interface EsportsTeam {
  id: string;
  slug: string;
  name: string;
  code: string;
  image: string | null;
  backgroundImage: string | null;
  status: TeamStatus;
  /** The feed gives a home league by name and region only — no id. */
  league: { name: string; region: string | null } | null;
  players: EsportsPlayer[];
}

/** A team as standings and rosters refer to it: identity only, no result. */
export interface EsportsTeamRef {
  id: string;
  slug: string | null;
  name: string;
  code: string;
  image: string | null;
}

export interface StandingsRow {
  /** The feed's ordinal. Tied teams share one, so ranks can repeat. */
  rank: number;
  tied: boolean;
  team: EsportsTeamRef;
  wins: number;
  losses: number;
  /** Percentage to one decimal, or null when the team has not played yet. */
  winRate: number | null;
}

export interface BracketTeam extends EsportsTeamRef {
  /** False for a slot whose team the bracket has not decided yet. */
  decided: boolean;
  gameWins: number;
  outcome: MatchOutcome | null;
}

export interface BracketMatch {
  matchId: string;
  state: string;
  /** Feeder matches, for wiring the bracket up (TASK-306). */
  previousMatchIds: string[];
  teams: BracketTeam[];
}

/**
 * One section of a tournament. Round-robin splits publish a ranked table; swiss
 * and knockout stages publish only their matches.
 */
export type StandingsStage =
  | { kind: "table"; stageName: string; sectionName: string; rows: StandingsRow[] }
  | { kind: "bracket"; stageName: string; sectionName: string; matches: BracketMatch[] };

export interface EsportsEvent {
  /** The match id. `getSchedule` has no separate event id, so this is the key. */
  matchId: string;
  /** ISO 8601, always UTC as published. */
  startTime: string;
  state: EventState;
  /** "Week 4", "Playoffs", … when the format has blocks. */
  blockName: string | null;
  /** Series length; null when the feed omits the strategy. */
  bestOf: number | null;
  league: EsportsEventLeague;
  tournamentId: string | null;
  teams: EsportsEventTeam[];
  hasVod: boolean;
}
