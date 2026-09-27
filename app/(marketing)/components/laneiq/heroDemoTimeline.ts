/**
 * The hero demo's script, as a pure function of elapsed time so it can be tested without a
 * clock. The real preview takes about ninety seconds; this plays the same three stages in
 * under ten, and the card says it is sped up.
 */

export const DEMO_RIOT_ID = "Kayjay#EUW";

/** Same words the Analyze form shows while a real request is in flight. */
export const DEMO_STEPS: readonly string[] = [
  "Pulling last 10 ranked matches…",
  "Parsing timeline events…",
  "Grading against your rank…",
];

const TYPE_MS_PER_CHAR = 90;
const STEP_MS = 1000;
const HOLD_MS = 5000;

const TYPE_MS = DEMO_RIOT_ID.length * TYPE_MS_PER_CHAR;
export const DEMO_LOOP_MS = TYPE_MS + DEMO_STEPS.length * STEP_MS + HOLD_MS;

export interface DemoFrame {
  /** How much of the Riot ID is in the box. */
  typed: string;
  /** Index into DEMO_STEPS while "analyzing", otherwise null. */
  step: number | null;
  /** The verdict is on screen. */
  done: boolean;
}

export function demoFrame(elapsedMs: number): DemoFrame {
  const t = ((elapsedMs % DEMO_LOOP_MS) + DEMO_LOOP_MS) % DEMO_LOOP_MS;
  if (t < TYPE_MS) {
    return {
      typed: DEMO_RIOT_ID.slice(0, Math.floor(t / TYPE_MS_PER_CHAR) + 1),
      step: null,
      done: false,
    };
  }
  const afterTyping = t - TYPE_MS;
  const step = Math.floor(afterTyping / STEP_MS);
  if (step < DEMO_STEPS.length) return { typed: DEMO_RIOT_ID, step, done: false };
  return { typed: DEMO_RIOT_ID, step: null, done: true };
}

/** What a reader with reduced motion sees: the finished report, still. */
export const DEMO_FINAL: DemoFrame = { typed: DEMO_RIOT_ID, step: null, done: true };
