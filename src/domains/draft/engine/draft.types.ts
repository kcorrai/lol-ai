// Vocabulary shared by the draft server and the draft client. The engine is
// deliberately free of Prisma, fetch and React so both sides can run the exact
// same transition and never disagree (ADR-016).

export type DraftSide = "BLUE" | "RED";
export type DraftActionKind = "BAN" | "PICK";
export type SeriesMode = "NORMAL" | "FEARLESS" | "TEAM_FEARLESS";
export type DraftGamePhase = "LOBBY" | "IN_PROGRESS" | "COMPLETE";

/** Which team (1 or 2) occupies a side. Sides swap between games of a series. */
export type TeamNumber = 1 | 2;

/** What the person looking at the room may do. Resolved from their token. */
export type ViewerRole = DraftSide | "SPECTATOR";

export interface DraftStep {
  index: number;
  side: DraftSide;
  kind: DraftActionKind;
  /** Which of that side's five ban or pick slots this step fills. */
  slot: number;
}

export interface DraftActionState {
  step: number;
  side: DraftSide;
  kind: DraftActionKind;
  /** null means the ban was passed, or the turn expired without a selection. */
  championKey: string | null;
  timedOut: boolean;
}

export interface DraftGameState {
  gameNumber: number;
  blueTeam: TeamNumber;
  phase: DraftGamePhase;
  /** Index of the next step to be taken, 0…20. 20 means the draft is done. */
  step: number;
  blueReady: boolean;
  redReady: boolean;
  /** ISO timestamp the current turn began, or null outside a live turn. */
  turnStartedAt: string | null;
  winnerSide: DraftSide | null;
  /** Bumped on every accepted transition. Drives polling and optimistic locking. */
  version: number;
  actions: DraftActionState[];
}

export interface DraftSeriesState {
  code: string;
  team1Name: string;
  team2Name: string;
  mode: SeriesMode;
  gameCount: number;
  /** Seconds per turn. 0 means untimed. */
  timerSeconds: number;
  disabledChampions: string[];
  createdAt: string;
  expiresAt: string;
  games: DraftGameState[];
}

export type LegalityReason =
  | "not-your-turn"
  | "draft-not-running"
  | "already-used"
  | "series-locked"
  | "disabled"
  | "unknown-champion";

export type LegalityResult = { ok: true } | { ok: false; reason: LegalityReason };

export type TransitionReason =
  | LegalityReason
  | "unknown-game"
  | "nothing-to-undo"
  | "not-complete"
  | "not-in-lobby";

export type TransitionResult =
  | { ok: true; series: DraftSeriesState; changed: boolean }
  | { ok: false; reason: TransitionReason };

/** Champion keys are compared case-insensitively; this is the single normaliser. */
export function normaliseKey(key: string): string {
  return key.trim().toLowerCase();
}
