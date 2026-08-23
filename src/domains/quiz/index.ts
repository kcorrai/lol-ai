// Public API of the quiz domain — the sanctioned entry point for other domains
// and for the route handlers (CLAUDE.md §4: nothing imports the service files
// directly).

export type {
  AbilitySlot,
  BuildItem,
  BuildSpell,
  CellMatch,
  ChampionAbility,
  ClassicCell,
  ClassicRow,
  DailyPuzzle,
  Gender,
  GuessResult,
  Position,
  QuizChampion,
  QuizMode,
  QuizPrompt,
  RangeType,
  YearHint,
} from "./types/quiz.types";
export { ABILITY_SLOTS, QUIZ_MODES, isQuizMode } from "./types/quiz.types";

export { DATASET_VERSION, findChampion, resolveGuess } from "./services/championPool";
export { championIndex as championCatalogue } from "./services/championPool";

export { nextResetAt, puzzleNumber, secondsUntilReset, utcDateKey } from "./services/dailySeed";

// The one component other areas of the app render: the landing page's Daily
// band needs the same clock the quiz hero shows.
export { ResetCountdown } from "./components/ResetCountdown";

export { EMOJI_PER_CHAMPION, clueLadder, nextClueNote } from "./services/clueLadder";
export type { ClueStep } from "./services/clueLadder";

export { CLASSIC_COLUMNS, compareClassic, isSolvedRow } from "./services/classicMode";
export type { ClassicColumnKey } from "./services/classicMode";

export {
  abilityFor,
  answerFor,
  buildPuzzle,
  skinNumFor,
  visibleEmoji,
} from "./services/puzzleService";

export { UnknownChampionError, judgeGuess, missCount, revealAnswer } from "./services/guessService";

export { rankPlayers } from "./services/leaderboardRanking";
export type { PlayerResults, RankedPlayer } from "./services/leaderboardRanking";

export { buildShareGrid } from "./services/shareGrid";
export type { ModeResult, ShareGridInput } from "./services/shareGrid";

export {
  FREEZES_PER_WEEK,
  INITIAL_STREAK,
  advanceStreak,
  isoWeekKey,
  streakStatus,
} from "./services/streakRules";
export type { StreakState } from "./services/streakRules";
