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
  wardsDestroyed: number | null;
  items: number[];
  runes: { primaryStyle: number; secondaryStyle: number; perks: number[] } | null;
  /** Skill levelling order, in the order taken: ["Q","W","E","Q",…]. Empty when unpublished. */
  abilities: string[];
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
  /** First published frame, ISO 8601. Null when the feed has no opening window. */
  firstFrameAt: string | null;
  lastFrameAt: string;
  /**
   * Seconds between the first and last published frame — elapsed time so far
   * while a game is live, the game's length once it is finished.
   *
   * Null when the opening frames were never published, which is the only honest
   * answer: every per-minute figure on the site is null in that case rather than
   * computed against an assumed length.
   */
  durationSeconds: number | null;
  blue: GameTeamStats;
  red: GameTeamStats;
}

/**
 * A recorded broadcast of one game.
 *
 * `startMillis` is where this game begins inside the series VOD — the feed
 * publishes one video per series and marks each game's offset in it.
 */
export interface GameVod {
  /** "youtube" or "twitch" as published; anything else is dropped when linking. */
  provider: string;
  /** Video id for YouTube, video id for a Twitch VOD. */
  parameter: string;
  locale: string;
  /** The language written for a reader: "English", "Türkçe". */
  language: string;
  /** Milliseconds into the video, or null when this locale's copy has no offset. */
  startMillis: number | null;
}

/** A live broadcast of a match, in one language. */
export interface EventStream {
  provider: string;
  /** Channel name for Twitch, video id for YouTube. */
  parameter: string;
  locale: string;
  language: string;
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
  vods: GameVod[];
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
  /** Live broadcasts, one per language. Only `getLive` publishes these. */
  streams: EventStream[];
}

export interface ProChampionStat {
  /** Data Dragon champion id, e.g. "MissFortune". */
  championId: string;
  picks: number;
  wins: number;
  /** Games whose winner could be derived. Win rate is over these, not over picks. */
  decidedGames: number;
  /** Percentage, or null when no game in the sample was decided. */
  winRate: number | null;
  /** Percentage of games in the sample this champion was picked in. */
  pickRate: number;
  roles: Partial<Record<PlayerRole, number>>;
  topRole: PlayerRole | null;
}

/**
 * What the pros are playing, over a sample of finished games.
 *
 * No ban or presence figure: neither feed publishes bans, so the honest table is
 * picks and results (see `proMeta.ts`).
 */
export interface ProMeta {
  games: number;
  /** Patches covered by the sample, ascending. */
  patches: string[];
  /** Timestamp of the most recent game's final frame, ISO 8601. */
  lastGameAt: string | null;
  /** True when the sample is too small for the numbers to mean much. */
  thinSample: boolean;
  /** Most-picked first. */
  champions: ProChampionStat[];
}

/** One finished game as it enters an aggregate, with the context `GameStats` alone lacks. */
export interface SampledGame {
  matchId: string;
  gameNumber: number;
  leagueName: string;
  blueTeamName: string | null;
  redTeamName: string | null;
  stats: GameStats;
}

export interface ItemFrequency {
  itemId: number;
  games: number;
}

export interface RuneVariant {
  primaryStyle: number;
  secondaryStyle: number;
  /** Keystone first, then the rest of the page as the feed ordered it. */
  perks: number[];
  games: number;
  wins: number;
}

export interface ProGameAppearance {
  matchId: string;
  gameNumber: number;
  leagueName: string;
  handle: string;
  teamName: string | null;
  opponentName: string | null;
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  items: number[];
  won: boolean | null;
}

export interface ProPlayerOnChampion {
  handle: string;
  teamName: string | null;
  games: number;
  wins: number;
}

/**
 * Per-game averages for a champion in pro play.
 *
 * The absolute figures are per game and are named that way on every page that
 * prints them. The `…PerMin` pair is derived from the game lengths in the sample
 * (see `duration.ts`) and is null when none of the sampled games published the
 * opening frames a length is measured from.
 */
export interface ProChampionAverages {
  kills: number;
  deaths: number;
  assists: number;
  /** (kills + assists) / max(deaths, 1). */
  kda: number;
  creepScore: number;
  gold: number;
  /** Mean length of the sampled games, in seconds. Null when none published one. */
  gameLengthSeconds: number | null;
  /** Farm and income over the games that have a measurable length. */
  creepScorePerMin: number | null;
  goldPerMin: number | null;
  /** Null when the details feed published none of it for this champion's games. */
  wardsPlaced: number | null;
  wardsDestroyed: number | null;
  killParticipation: number | null;
  damageShare: number | null;
  winRate: number;
}

/** How pros actually finished a champion, over a sample of games. */
export interface ProChampionBuild {
  championId: string;
  games: number;
  wins: number;
  averages: ProChampionAverages;
  /** Most-finished items first. Trinkets and consumables excluded. */
  items: ItemFrequency[];
  /** Most-run rune pages first. */
  runes: RuneVariant[];
  /** The most common levelling order, truncated to the first levels that agree. */
  skillOrder: string[];
  skillOrderGames: number;
  topPlayers: ProPlayerOnChampion[];
  recentGames: ProGameAppearance[];
}
