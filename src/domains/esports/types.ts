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
