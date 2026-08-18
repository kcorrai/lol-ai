// A wave, reduced to the two numbers that decide all four wave states: who has more
// minions, and where the fight between them is standing. Everything the lesson teaches
// falls out of one rule — minions push toward whoever kills fewer of them — so that is
// the only rule this reducer has. See docs/adr/ADR-027-academy-mastery-lifecycle.md.

export interface WaveState {
  /** Your minions minus theirs. Positive means your wave is the bigger one. */
  advantage: number;
  /** Where the wave stands: -3 your turret, 0 the middle of the lane, +3 their turret. */
  position: number;
}

/** What the player does to the wave for one cycle. */
export type WaveAction = "clear" | "thin" | "last-hit" | "hold";

export type WaveGoal = "freeze" | "slow-push" | "crash";

export const WAVE_ACTIONS: readonly WaveAction[] = ["clear", "thin", "last-hit", "hold"] as const;

export function isWaveAction(value: string): value is WaveAction {
  return (WAVE_ACTIONS as readonly string[]).includes(value);
}

// How much each choice shifts the minion count in your favour. `hold` is negative because
// leaving their wave alone lets it outnumber yours — which is the only way to bring a wave
// back toward your own turret.
const SHIFT: Record<WaveAction, number> = {
  clear: 2,
  thin: 1,
  "last-hit": 0,
  hold: -1,
};

const MAX_ADVANTAGE = 6;
const TURRET = 3;

function clamp(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value));
}

/**
 * How far the wave walks in one cycle. A one-minion edge is not enough to move anything —
 * that is what makes a freeze possible at all: hold the gap small and the wave stands still.
 */
function drift(advantage: number): number {
  const size = Math.abs(advantage);
  if (size <= 1) return 0;
  return Math.sign(advantage) * (size >= 4 ? 2 : 1);
}

export function stepWave(state: WaveState, action: WaveAction): WaveState {
  const advantage = clamp(state.advantage + SHIFT[action], MAX_ADVANTAGE);
  return { advantage, position: clamp(state.position + drift(advantage), TURRET) };
}

/** Every state the wave passes through, start included, so the drill can animate it. */
export function simulateWave(start: WaveState, actions: WaveAction[]): WaveState[] {
  const states: WaveState[] = [start];
  for (const action of actions) states.push(stepWave(states[states.length - 1], action));
  return states;
}

export function meetsGoal(state: WaveState, goal: WaveGoal): boolean {
  switch (goal) {
    // Arrived at their turret. Overshooting is not a thing — the wave dies there.
    case "crash":
      return state.position >= TURRET;
    // Sitting still just outside your own turret. Both halves matter: a wave parked in the
    // middle is not a freeze, and one that reached your turret has crashed into it instead.
    case "freeze":
      return state.position <= -1 && state.position > -TURRET && Math.abs(state.advantage) <= 1;
    // Still growing and still on its way. A slow push that already arrived is a crash.
    case "slow-push":
      return state.advantage >= 3 && state.position < TURRET;
  }
}
