// The shape of a career timeline. Nothing here is persisted — every event is
// assembled on read from the table that already owns the fact (see ADR-031).

export type CareerEventKind =
  | "joined"
  | "rank_change"
  | "peak"
  | "champion_era"
  | "record"
  | "achievement"
  | "habit"
  | "academy"
  | "season";

/** Which filter chip an event answers to. Kinds are finer than a reader wants to filter by. */
export type CareerEventGroup = "rank" | "champions" | "records" | "learning";

export type CareerEventTone = "good" | "bad" | "neutral";

export interface CareerEvent {
  /** Stable across requests — derived from the fact, never from array position. */
  id: string;
  kind: CareerEventKind;
  group: CareerEventGroup;
  /** ISO. Everything on the spine sorts by this and nothing else. */
  at: string;
  title: string;
  detail: string | null;
  tone: CareerEventTone;
  /**
   * How much a reader would miss this if it were cut. Curation keeps the heaviest
   * events in a band and drops the rest — an active month otherwise arrives as forty
   * indistinguishable rows.
   */
  weight: number;
  href: string | null;
}

/** One month of a career. The band is the unit the page scrolls through. */
export interface CareerBand {
  /** "2026-08" — sortable, and the React key. */
  key: string;
  /** "August 2026" */
  label: string;
  games: number;
  wins: number;
  /** 0..100, or null for a month with no games (a band only exists if something happened). */
  winRate: number | null;
  /** LP moved across the month, null when there is no snapshot at both ends. */
  lpDelta: number | null;
  /** "Gold IV" at the month's last snapshot. */
  rankAtClose: string | null;
  events: CareerEvent[];
}

export interface CareerMastery {
  championId: number;
  championName: string;
  level: number;
  points: number;
}

export interface CareerSummary {
  gameName: string;
  tagLine: string;
  summonerLevel: number;
  /** The oldest game we hold — the timeline is honest that this is where *tracking* starts. */
  firstTrackedAt: string | null;
  lastTrackedAt: string | null;
  totalGames: number;
  totalHours: number;
  currentRank: string | null;
  peakRank: string | null;
  /** All-time, and the only figure on the page that predates the match window. */
  topMastery: CareerMastery[];
}

export interface LpPoint {
  at: string;
  /** Absolute LP from Iron IV 0, so the line is continuous across tier crossings. */
  value: number;
  label: string;
}

export interface CareerTimeline {
  summary: CareerSummary;
  bands: CareerBand[];
  lpSeries: LpPoint[];
  /** Events dropped by curation, so the page can offer to show them. */
  trimmed: number;
}

/**
 * The narrow match row every builder works from. Deliberately not a Prisma type: the
 * builders are pure and testable precisely because they never meet the database.
 */
export interface CareerMatchRow {
  matchId: string;
  championId: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  csPerMinute: number;
  visionScore: number;
  won: boolean;
  gameStart: Date;
  /** Seconds. */
  gameDuration: number;
}
