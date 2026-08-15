// Public API of the draft domain — the client-safe half. The engine is pure and
// runs on both the server and the client (ADR-016); nothing here touches Prisma,
// fetch or React. Server-only services live in `@/domains/draft/server`.
export { DRAFT_SEQUENCE, DRAFT_STEP_COUNT, SLOTS_PER_SIDE, sideToAct, stepAt, opposingSide, isComplete } from "@/domains/draft/engine/sequence";
export { canSelect, unavailableReason, championsUsedInGame } from "@/domains/draft/engine/legality";
export { computeSeriesLockouts, teamOnSide } from "@/domains/draft/engine/lockouts";
export { applyAction, applyUndo, resolveTimeout } from "@/domains/draft/engine/reducer";
export { applyReady, applyGameResult, applyBlueTeam } from "@/domains/draft/engine/lobby";
export { seriesStatus } from "@/domains/draft/engine/series";
export { createGame, createGames, findGame, otherTeam } from "@/domains/draft/engine/stateUtils";
export { turnDeadlineMs, remainingMs, hasExpired } from "@/domains/draft/engine/timing";
export { normaliseKey } from "@/domains/draft/engine/draft.types";
export type {
  DraftActionKind,
  DraftActionState,
  DraftGamePhase,
  DraftGameState,
  DraftSeriesState,
  DraftSide,
  DraftStep,
  LegalityReason,
  LegalityResult,
  SeriesMode,
  TeamNumber,
  TransitionReason,
  TransitionResult,
  ViewerRole,
} from "@/domains/draft/engine/draft.types";
export type { SeriesLockouts } from "@/domains/draft/engine/lockouts";
export type { SeriesStatus } from "@/domains/draft/engine/series";
