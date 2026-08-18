import type { WaveGoal, WaveState } from "@/domains/academy/drills/waveSim";

// The Academy content model. Lessons are typed TypeScript objects rather than MDX so the
// curriculum is typechecked, unit-testable and free to reuse the app's own primitives
// (ChampionIcon, ItemIcon) inside a block — see docs/adr/ADR-019-academy-content-model.md.

/**
 * The five positions in the Academy's own vocabulary. Deliberately not Prisma's `Position`:
 * this module is imported by client components (ADR-025), and a value import of the Prisma
 * enum drags `async_hooks` into the browser bundle. The mapping lives in `roles.ts`.
 */
export type RoleId = "top" | "jungle" | "mid" | "adc" | "support";

/** The curriculum everyone reads, in teaching order. */
export type CoreTrackId =
  | "foundations"
  | "laning"
  | "vision"
  | "macro"
  | "teamfighting"
  | "mental";

/**
 * A role path carries its role as its id — there is exactly one path per role. `"champion"` is
 * the one member with no `Track` behind it: champion lessons are generated per player and never
 * enter the registry (ADR-030).
 */
export type TrackId = CoreTrackId | RoleId | "champion";

export type TrackLevel = "foundation" | "core" | "advanced";

/** Free lessons are the SEO surface and the funnel; pro lessons preview, then gate. */
export type LessonAccess = "free" | "pro";

/**
 * Leaks a lesson claims to fix. Values mirror `habitType` in
 * `src/domains/analysis/services/habitDetectionService.ts` so a detected habit maps
 * straight onto a lesson with no translation table in between.
 */
export type LeakTag =
  | "low_cs"
  | "low_vision"
  | "high_deaths"
  | "objective_neglect"
  | "late_game_throw"
  | "tilt_prone";

// ── Lesson body ───────────────────────────────────────────────────────────────

export interface ProseBlock {
  kind: "prose";
  text: string;
}

export interface KeyPointBlock {
  kind: "keyPoint";
  title: string;
  text: string;
}

export interface ChecklistBlock {
  kind: "checklist";
  title: string;
  items: string[];
}

/** The mistake-and-fix pair. Naming the wrong habit out loud is what makes it stick. */
export interface MistakeBlock {
  kind: "mistake";
  title: string;
  text: string;
  fix: string;
}

export interface TableBlock {
  kind: "table";
  caption: string;
  head: string[];
  rows: string[][];
}

/** Renders the drill with this id inline; the drill itself lives on `Lesson.drills`. */
export interface DrillBlock {
  kind: "drill";
  drillId: string;
}

/** Everything after this marker is behind the pro gate on a `pro` lesson. */
export interface GateBlock {
  kind: "gate";
}

export type LessonBlock =
  | ProseBlock
  | KeyPointBlock
  | ChecklistBlock
  | MistakeBlock
  | TableBlock
  | DrillBlock
  | GateBlock;

// ── Drills ────────────────────────────────────────────────────────────────────

export interface DrillOption {
  id: string;
  label: string;
  /** Shown after answering — wrong options have to teach too, not just be wrong. */
  explain: string;
  correct: boolean;
}

export interface QuizDrill {
  id: string;
  kind: "quiz";
  prompt: string;
  options: DrillOption[];
}

export interface DecisionDrill {
  id: string;
  kind: "decision";
  /** The scenario as a player would read it off the screen. */
  situation: string;
  facts: string[];
  options: DrillOption[];
}

export interface OrderDrill {
  id: string;
  kind: "order";
  prompt: string;
  items: { id: string; label: string }[];
  /** Item ids in the one correct sequence. */
  correctOrder: string[];
  explain: string;
}

/** Where an option sits on the Rift schematic, in fractions of its box. `r` is the hit radius. */
export interface MapPoint {
  x: number;
  y: number;
  r: number;
}

export interface MapDrillOption extends DrillOption {
  at: MapPoint;
}

/**
 * Pick a spot on the map — a ward, a danger zone, where the enemy jungler is. The answer is
 * still a choice between authored options, so this grades down the same path a quiz does; a
 * click is just a nicer way to say which one. The options are never listed as text, which is
 * the whole point: reading four ward descriptions is not the skill being tested.
 */
export interface MapDrill {
  id: string;
  kind: "map";
  prompt: string;
  options: MapDrillOption[];
}

/** Drive a wave to a named state, one decision per cycle. Graded by `drills/waveSim.ts`. */
export interface WaveSimDrill {
  id: string;
  kind: "wave-sim";
  prompt: string;
  start: WaveState;
  goal: WaveGoal;
  /** How many cycles the player gets. */
  cycles: number;
  explain: string;
}

export type Drill = QuizDrill | DecisionDrill | OrderDrill | MapDrill | WaveSimDrill;

export type DrillKind = Drill["kind"];

/** Drills answered by picking one authored option, whatever the surface looks like. */
export type ChoiceDrill = QuizDrill | DecisionDrill | MapDrill;

export function isChoiceDrill(drill: Drill): drill is ChoiceDrill {
  return drill.kind === "quiz" || drill.kind === "decision" || drill.kind === "map";
}

// ── Field assignment (Proof of Practice) ──────────────────────────────────────

/** Metrics we can actually read back off a player's matches. Nothing else is promised. */
export type AssignmentMetric =
  | "csPerMinute"
  | "visionScore"
  | "deathsPerGame"
  | "killParticipation"
  | "kda";

export interface FieldAssignment {
  metric: AssignmentMetric;
  direction: "increase" | "decrease";
  /** Target movement from the player's own baseline, in the metric's own unit. */
  delta: number;
  games: number;
  instruction: string;
}

// ── Lesson & track ────────────────────────────────────────────────────────────

export interface Lesson {
  slug: string;
  trackId: TrackId;
  title: string;
  /** One sentence — doubles as the meta description and the card subtitle. */
  summary: string;
  minutes: number;
  access: LessonAccess;
  objectives: string[];
  blocks: LessonBlock[];
  drills: Drill[];
  assignment: FieldAssignment;
  fixes: LeakTag[];
}

export interface Track {
  id: TrackId;
  title: string;
  tagline: string;
  description: string;
  level: TrackLevel;
  lessons: Lesson[];
  /**
   * Set on a role path, absent on a core track. Role paths sit *beside* the curriculum rather
   * than inside it: they only cover what is specific to the role, and the Academy never picks
   * one for a player whose own games are in a different role (ADR-028).
   */
  role?: RoleId;
}

// ── Progress ──────────────────────────────────────────────────────────────────

export type LessonStatus = "available" | "in_progress" | "completed" | "mastered" | "review";

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  attempts: number;
  bestScore: number;
  completedAt: string | null;
}
