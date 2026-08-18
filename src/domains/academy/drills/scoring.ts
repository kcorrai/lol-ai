import { isChoiceDrill, type Drill, type DrillOption, type WaveSimDrill } from "@/domains/academy/types";
import { isWaveAction, meetsGoal, simulateWave } from "./waveSim";

/** One attempt at one drill. `answer` is an option id, or the ordered ids for an order drill. */
export interface DrillAttempt {
  drillId: string;
  answer: string[];
}

export interface DrillResult {
  drillId: string;
  correct: boolean;
  /** The explanation to show, drawn from whatever the player actually picked. */
  explanation: string;
}

function optionById(options: DrillOption[], id: string): DrillOption | undefined {
  return options.find((o) => o.id === id);
}

function gradeChoice(options: DrillOption[], answer: string[]): { correct: boolean; explanation: string } {
  const picked = answer.length === 1 ? optionById(options, answer[0]) : undefined;
  if (!picked) {
    return { correct: false, explanation: "No answer recorded." };
  }
  return { correct: picked.correct, explanation: picked.explain };
}

function gradeOrder(
  correctOrder: string[],
  explain: string,
  answer: string[]
): { correct: boolean; explanation: string } {
  const correct =
    answer.length === correctOrder.length && answer.every((id, i) => id === correctOrder[i]);
  return { correct, explanation: explain };
}

/**
 * The player's cycle-by-cycle plan, replayed through the same reducer the drill animates with,
 * and judged only on where the wave ended up. A plan that reaches the goal early and holds it
 * is as correct as one that arrives on the last cycle — the goal is a state, not a route.
 */
function gradeWaveSim(drill: WaveSimDrill, answer: string[]): { correct: boolean; explanation: string } {
  if (answer.length !== drill.cycles || !answer.every(isWaveAction)) {
    return { correct: false, explanation: drill.explain };
  }

  const states = simulateWave(drill.start, answer.filter(isWaveAction));
  return { correct: meetsGoal(states[states.length - 1], drill.goal), explanation: drill.explain };
}

export function gradeDrill(drill: Drill, answer: string[]): DrillResult {
  const graded = isChoiceDrill(drill)
    ? gradeChoice(drill.options, answer)
    : drill.kind === "order"
      ? gradeOrder(drill.correctOrder, drill.explain, answer)
      : gradeWaveSim(drill, answer);

  return { drillId: drill.id, ...graded };
}

export interface LessonScore {
  results: DrillResult[];
  correct: number;
  total: number;
  /** 0–100, rounded. A lesson with no drills scores 100 on completion. */
  score: number;
  passed: boolean;
}

/** A lesson is passed at two thirds correct — enough to have understood it, not a perfection tax. */
export const PASS_RATIO = 2 / 3;

/**
 * Grades a set of drills. Takes the drills rather than the lesson so a gated pro lesson can
 * be scored on the half the reader was actually shown.
 */
export function scoreLesson(drills: Drill[], attempts: DrillAttempt[]): LessonScore {
  const answers = new Map(attempts.map((a) => [a.drillId, a.answer]));
  const results = drills.map((drill) => gradeDrill(drill, answers.get(drill.id) ?? []));

  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const score = total === 0 ? 100 : Math.round((correct / total) * 100);

  return { results, correct, total, score, passed: total === 0 || correct / total >= PASS_RATIO };
}
