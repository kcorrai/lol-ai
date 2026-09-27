import type { Position, RankTier, SessionKind } from "@prisma/client";

// The "find my coach" questions, turned into a storefront search.
//
// Pure, so the rule that decides which coaches a student is sent to is tested
// on its own — and stored nowhere: the answers become a URL and that is all.

export const FOCUS_AREAS = [
  { value: "laning", label: "Laning phase" },
  { value: "macro", label: "Macro & map decisions" },
  { value: "teamfights", label: "Teamfighting" },
  { value: "mechanics", label: "Mechanics" },
  { value: "mental", label: "Mental & tilt" },
  { value: "pool", label: "Champion pool" },
] as const;

export type FocusArea = (typeof FOCUS_AREAS)[number]["value"];

export interface QuizAnswers {
  role: Position | null;
  /** The student's own tier now. Null when they did not say or are unranked. */
  tier: RankTier | null;
  focus: FocusArea | null;
  kind: SessionKind | null;
  /** Whole currency units; null for "any". */
  maxPrice: number | null;
  language: string | null;
}

const LADDER: readonly RankTier[] = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];

/**
 * The rank floor for a student's coaches: at least one tier above them.
 *
 * A coach at your own rank can still teach, but "someone who has already been
 * where I am going" is what a student is asking for. Capped at Master, because
 * above it there are too few coaches for a floor to leave anyone to choose.
 */
export function coachFloor(tier: RankTier | null): RankTier | null {
  if (!tier) return null;
  const next = LADDER[Math.min(LADDER.indexOf(tier) + 1, LADDER.length - 1)];
  return LADDER.indexOf(next) > LADDER.indexOf("MASTER") ? "MASTER" : next;
}

/** The goal line a booking request starts with, so the student need not write it twice. */
export function goalFor(focus: FocusArea | null): string {
  const area = FOCUS_AREAS.find((f) => f.value === focus);
  return area ? `I want to work on my ${area.label.toLowerCase()}.` : "";
}

/** The storefront URL these answers lead to. */
export function quizResultPath(answers: QuizAnswers): string {
  const params = new URLSearchParams();
  if (answers.role) params.set("role", answers.role);
  if (answers.kind) params.set("kind", answers.kind);
  const floor = coachFloor(answers.tier);
  if (floor) params.set("minTier", floor);
  if (answers.language) params.set("lang", answers.language);
  if (answers.maxPrice) params.set("maxPrice", String(answers.maxPrice));
  const goal = goalFor(answers.focus);
  if (goal) params.set("goal", goal);

  const qs = params.toString();
  return qs ? `/coaches?${qs}` : "/coaches";
}
