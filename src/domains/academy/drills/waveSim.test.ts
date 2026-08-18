import { describe, expect, it } from "vitest";
import { isWaveAction, meetsGoal, simulateWave, stepWave, type WaveState } from "./waveSim";

const MIDDLE: WaveState = { advantage: 0, position: 0 };

describe("stepWave", () => {
  it("moves nothing while the minion gap is one or less", () => {
    expect(stepWave(MIDDLE, "thin")).toEqual({ advantage: 1, position: 0 });
    expect(stepWave(MIDDLE, "hold")).toEqual({ advantage: -1, position: 0 });
  });

  it("walks the wave toward whoever has fewer minions", () => {
    expect(stepWave({ advantage: 1, position: 0 }, "thin")).toEqual({ advantage: 2, position: 1 });
    expect(stepWave({ advantage: -1, position: 0 }, "hold")).toEqual({ advantage: -2, position: -1 });
  });

  it("walks it twice as fast once the gap is a full wave", () => {
    expect(stepWave({ advantage: 2, position: 0 }, "clear")).toEqual({ advantage: 4, position: 2 });
  });

  it("stops at the turrets and at a full wave of advantage", () => {
    expect(stepWave({ advantage: 6, position: 3 }, "clear")).toEqual({ advantage: 6, position: 3 });
    expect(stepWave({ advantage: -6, position: -3 }, "hold")).toEqual({ advantage: -6, position: -3 });
  });
});

describe("simulateWave", () => {
  it("returns the starting state plus one per action", () => {
    expect(simulateWave(MIDDLE, ["clear", "clear"])).toHaveLength(3);
  });

  it("is pure — the same actions from the same start give the same states", () => {
    const once = simulateWave(MIDDLE, ["thin", "hold", "clear"]);
    const twice = simulateWave(MIDDLE, ["thin", "hold", "clear"]);
    expect(once).toEqual(twice);
  });
});

describe("meetsGoal", () => {
  it("counts arriving at their turret as a crash", () => {
    const states = simulateWave(MIDDLE, ["clear", "clear"]);
    expect(meetsGoal(states[states.length - 1], "crash")).toBe(true);
  });

  // The point of the drill: clearing every cycle crashes the wave instead of building one.
  it("does not count a crashed wave as a slow push", () => {
    const crashed = simulateWave(MIDDLE, ["clear", "clear", "clear"]);
    expect(meetsGoal(crashed[crashed.length - 1], "slow-push")).toBe(false);

    const built = simulateWave(MIDDLE, ["thin", "thin", "thin"]);
    expect(meetsGoal(built[built.length - 1], "slow-push")).toBe(true);
  });

  it("freezes only when the wave is held still on your own half", () => {
    // Let it build, let it walk to you, then hold it steady.
    const frozen = simulateWave(MIDDLE, ["hold", "hold", "last-hit", "thin"]);
    expect(frozen[frozen.length - 1]).toEqual({ advantage: -1, position: -2 });
    expect(meetsGoal(frozen[frozen.length - 1], "freeze")).toBe(true);

    // Same idea, never stopped: the wave runs past the freeze into your own turret.
    const crashedHome = simulateWave(MIDDLE, ["hold", "hold", "hold", "hold"]);
    expect(meetsGoal(crashedHome[crashedHome.length - 1], "freeze")).toBe(false);
  });

  it("does not count a wave parked in the middle as a freeze", () => {
    expect(meetsGoal({ advantage: 0, position: 0 }, "freeze")).toBe(false);
  });
});

describe("isWaveAction", () => {
  it("accepts the four actions and nothing else", () => {
    expect(isWaveAction("clear")).toBe(true);
    expect(isWaveAction("hold")).toBe(true);
    expect(isWaveAction("shove")).toBe(false);
    expect(isWaveAction("")).toBe(false);
  });
});
