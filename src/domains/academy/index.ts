// Public API of the academy domain — the LoL curriculum at /academy.
// Nothing outside this domain imports a content or service file directly (CLAUDE.md §4).

export {
  TRACKS,
  allLessons,
  getLesson,
  getLessonById,
  getTrack,
  isGated,
  lessonId,
  lessonNeighbours,
  lessonsForLeak,
  trackCompletion,
  trackIds,
  trackMinutes,
  visibleBlocks,
  visibleDrills,
} from "./curriculum";
export type { LessonNeighbours } from "./curriculum";

export { gradeDrill, scoreLesson, PASS_RATIO } from "./drills/scoring";
export type { DrillAttempt, DrillResult, LessonScore } from "./drills/scoring";

export { DEFAULT_PLACEMENT, placeFromProfile } from "./placement";
export type { Placement, PlacementLevel, PlacementSignal } from "./placement";

export { chooseNextLesson } from "./recommendation";
export type { Recommendation, RecommendationSource } from "./recommendation";

export { buildAssignmentTarget, formatMetric, METRIC_LABEL } from "./assignments";
export type { AssignmentTarget } from "./assignments";

export { ASSIGNMENT_EXPIRY_DAYS, judgeAssignment, meetsTarget, metricValue } from "./verification";
export type { AssignmentOutcome, Judgement, MatchReading } from "./verification";

export {
  checkAssignments,
  getActiveAssignments,
  getAssignmentForLesson,
  openAssignment,
  previewAssignmentTarget,
  restartAssignment,
} from "./services/assignmentService";
export type { AssignmentStatus, AssignmentView, CheckResult } from "./services/assignmentService";

export { DECAY_CHECK_DAYS, isDecayDue, judgeDecay } from "./decay";
export type { DecayVerdict } from "./decay";
export { checkMasteryDecay } from "./services/decayService";
export type { DecayResult } from "./services/decayService";

export { getAcademyOverview } from "./services/academyService";
export type { AcademyOverview } from "./services/academyService";
export {
  getLessonProgress,
  getLessonStatuses,
  markLessonOpened,
  submitLessonAttempt,
} from "./services/progressService";
export type { SubmitResult } from "./services/progressService";

export type {
  DecisionDrill,
  Drill,
  DrillKind,
  DrillOption,
  MapDrill,
  MapDrillOption,
  OrderDrill,
  QuizDrill,
  WaveSimDrill,
  FieldAssignment,
  LeakTag,
  Lesson,
  LessonAccess,
  LessonBlock,
  LessonProgress,
  LessonStatus,
  Track,
  TrackId,
  TrackLevel,
} from "./types";
