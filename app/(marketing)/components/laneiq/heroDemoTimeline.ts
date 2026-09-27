/**
 * The hero demo's script, as a pure function of elapsed time so it can be tested without a
 * clock. The real preview takes about ninety seconds; this plays the same stages in about
 * eleven, and the card says it is sped up.
 *
 * The player, the games and the grades are the sample report's (`SampleReport.tsx`): Emerald
 * jungle, 4W 6L, 4,318 events, the same four grades and the same verdict. The demo is that
 * report being produced, not a second invented player.
 */

export const DEMO_RIOT_ID = "Kayjay#EUW";

/** Same words the Analyze form shows while a real request is in flight. */
export const DEMO_STEPS: readonly string[] = [
  "Pulling last 10 ranked matches…",
  "Parsing timeline events…",
  "Grading against your rank…",
];

/** Ten games, 4W 6L, on the champion pool the landing page shows elsewhere. */
export const DEMO_MATCHES: readonly { champion: string; win: boolean }[] = [
  { champion: "Viego", win: false },
  { champion: "Viego", win: true },
  { champion: "Lee Sin", win: false },
  { champion: "Kha'Zix", win: false },
  { champion: "Viego", win: true },
  { champion: "Nidalee", win: false },
  { champion: "Viego", win: false },
  { champion: "Kha'Zix", win: true },
  { champion: "Viego", win: false },
  { champion: "Lee Sin", win: true },
];

export const DEMO_EVENTS = 4318;

export const DEMO_GRADES: readonly {
  label: string;
  value: number;
  tone: "accent" | "info" | "danger";
}[] = [
  { label: "Clear speed", value: 78, tone: "accent" },
  { label: "Gank conversion", value: 71, tone: "accent" },
  { label: "Objective setup", value: 41, tone: "info" },
  { label: "Vision before fights", value: 23, tone: "danger" },
];

const TYPE_MS_PER_CHAR = 90;
const MATCH_MS = 130;
const PARSE_MS = 1300;
const GRADE_MS = 1300;
/** The verdict arrives in three lines, one after another, then holds. */
const VERDICT_LINE_MS = 450;
const HOLD_MS = 5200;

const TYPE_MS = DEMO_RIOT_ID.length * TYPE_MS_PER_CHAR;
const PULL_MS = DEMO_MATCHES.length * MATCH_MS;
const VERDICT_MS = 3 * VERDICT_LINE_MS + HOLD_MS;
export const DEMO_LOOP_MS = TYPE_MS + PULL_MS + PARSE_MS + GRADE_MS + VERDICT_MS;

export type DemoStage = "typing" | "pulling" | "parsing" | "grading" | "done";

export interface DemoFrame {
  stage: DemoStage;
  /** How much of the Riot ID is in the box. */
  typed: string;
  /** Games fetched so far, 0–10. */
  matches: number;
  /** Timeline events counted so far. */
  events: number;
  /** How far the grade bars have filled, 0–1. */
  grading: number;
  /** Verdict lines on screen, 0–3. */
  verdictLines: number;
}

const DONE: DemoFrame = {
  stage: "done",
  typed: DEMO_RIOT_ID,
  matches: DEMO_MATCHES.length,
  events: DEMO_EVENTS,
  grading: 1,
  verdictLines: 3,
};

/** What a reader with reduced motion sees: the finished report, still. */
export const DEMO_FINAL: DemoFrame = DONE;

/** Ease-out, so a counter or a bar slows as it lands instead of stopping dead. */
function easeOut(p: number): number {
  return 1 - (1 - p) ** 3;
}

export function demoFrame(elapsedMs: number): DemoFrame {
  let t = ((elapsedMs % DEMO_LOOP_MS) + DEMO_LOOP_MS) % DEMO_LOOP_MS;

  if (t < TYPE_MS) {
    return {
      stage: "typing",
      typed: DEMO_RIOT_ID.slice(0, Math.floor(t / TYPE_MS_PER_CHAR) + 1),
      matches: 0,
      events: 0,
      grading: 0,
      verdictLines: 0,
    };
  }
  t -= TYPE_MS;

  if (t < PULL_MS) {
    return {
      ...DONE,
      stage: "pulling",
      matches: Math.floor(t / MATCH_MS) + 1,
      events: 0,
      grading: 0,
      verdictLines: 0,
    };
  }
  t -= PULL_MS;

  if (t < PARSE_MS) {
    const events = Math.round(DEMO_EVENTS * easeOut(t / PARSE_MS));
    return { ...DONE, stage: "parsing", events, grading: 0, verdictLines: 0 };
  }
  t -= PARSE_MS;

  if (t < GRADE_MS) {
    return { ...DONE, stage: "grading", grading: easeOut(t / GRADE_MS), verdictLines: 0 };
  }
  t -= GRADE_MS;

  return { ...DONE, verdictLines: Math.min(3, Math.floor(t / VERDICT_LINE_MS) + 1) };
}

/** Index into DEMO_STEPS for the stage, or null when no step is running. */
export function stepIndex(stage: DemoStage): number | null {
  if (stage === "pulling") return 0;
  if (stage === "parsing") return 1;
  if (stage === "grading") return 2;
  return null;
}
