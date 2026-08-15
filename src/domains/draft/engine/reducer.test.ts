import { describe, expect, it } from "vitest";
import { gameOf, makeSeries, play, POOL, started, T0 } from "@/test/draftFixtures";
import { applyAction, applyUndo, resolveTimeout } from "./reducer";
import { DRAFT_SEQUENCE } from "./sequence";
import type { TransitionResult } from "./draft.types";

const LATER = "2026-08-15T12:00:45.000Z"; // 45 s after T0, past a 30 s turn

function changedOf(result: TransitionResult): boolean {
  return result.ok && result.changed;
}

describe("applyAction", () => {
  it("drives a full 20-step draft to COMPLETE", () => {
    const done = play(started(makeSeries()), POOL);
    const game = gameOf(done);

    expect(game.step).toBe(20);
    expect(game.phase).toBe("COMPLETE");
    expect(game.turnStartedAt).toBeNull();
    expect(game.actions).toHaveLength(20);
    expect(game.actions.filter((a) => a.kind === "BAN")).toHaveLength(10);
    expect(game.actions.filter((a) => a.kind === "PICK")).toHaveLength(10);
    game.actions.forEach((a, i) => {
      expect(a.step).toBe(i);
      expect(a.side).toBe(DRAFT_SEQUENCE[i].side);
      expect(a.kind).toBe(DRAFT_SEQUENCE[i].kind);
    });
  });

  it("bumps the version and restarts the clock on every lock", () => {
    const before = started(makeSeries());
    const after = play(before, ["Ahri"]);
    expect(gameOf(after).version).toBe(gameOf(before).version + 1);
    expect(gameOf(after).turnStartedAt).toBe(T0);
  });

  it("never mutates the state it was given", () => {
    const before = started(makeSeries());
    const snapshot = JSON.stringify(before);
    play(before, ["Ahri", "Akali"]);
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("records a passed ban as a null champion", () => {
    const result = applyAction(started(makeSeries()), 1, "BLUE", null, T0);
    expect(result.ok).toBe(true);
    if (result.ok) expect(gameOf(result.series).actions[0].championKey).toBeNull();
  });

  it("rejects an unknown game", () => {
    const result = applyAction(started(makeSeries()), 7, "BLUE", "Ahri", T0);
    expect(result).toEqual({ ok: false, reason: "unknown-game" });
  });
});

describe("applyUndo", () => {
  it("steps back one action and returns the champion to the pool", () => {
    const after = play(started(makeSeries()), ["Ahri", "Akali"]);
    const undone = applyUndo(after, 1, LATER);
    expect(undone.ok).toBe(true);
    if (!undone.ok) return;

    const game = gameOf(undone.series);
    expect(game.step).toBe(1);
    expect(game.actions).toHaveLength(1);
    expect(game.turnStartedAt).toBe(LATER);
    expect(game.version).toBe(gameOf(after).version + 1);
    // "Akali" is selectable again — availability is derived from the action list.
    expect(applyAction(undone.series, 1, "RED", "Akali", LATER).ok).toBe(true);
  });

  it("reopens a completed draft", () => {
    const done = play(started(makeSeries()), POOL);
    const undone = applyUndo(done, 1, LATER);
    expect(undone.ok).toBe(true);
    if (undone.ok) expect(gameOf(undone.series).phase).toBe("IN_PROGRESS");
  });

  it("is a no-op before the first action", () => {
    expect(applyUndo(started(makeSeries()), 1, LATER)).toEqual({
      ok: false,
      reason: "nothing-to-undo",
    });
  });
});

describe("resolveTimeout", () => {
  it("does nothing while the turn is still live", () => {
    const series = started(makeSeries());
    const result = resolveTimeout(series, 1, T0, POOL);
    expect(result).toEqual({ ok: true, series, changed: false });
  });

  it("lapses an expired ban to no ban", () => {
    const result = resolveTimeout(started(makeSeries()), 1, LATER, POOL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [action] = gameOf(result.series).actions;
    expect(action).toMatchObject({ kind: "BAN", championKey: null, timedOut: true });
  });

  it("auto-locks an expired pick to the first legal champion in the pool", () => {
    // Ban out the first six of the pool, leaving "Annie" as the best legal pick.
    const atFirstPick = play(started(makeSeries()), POOL.slice(0, 6));
    const result = resolveTimeout(atFirstPick, 1, LATER, POOL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(gameOf(result.series).actions[6]).toMatchObject({
      kind: "PICK",
      championKey: "Annie",
      timedOut: true,
    });
  });

  it("is deterministic — same state and same clock, same outcome", () => {
    const series = play(started(makeSeries()), POOL.slice(0, 6));
    const a = resolveTimeout(series, 1, LATER, POOL);
    const b = resolveTimeout(series, 1, LATER, POOL);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("settles one turn per call, restarting the clock for the next", () => {
    const result = resolveTimeout(started(makeSeries()), 1, LATER, POOL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(gameOf(result.series).step).toBe(1);
    expect(gameOf(result.series).turnStartedAt).toBe(LATER);
    // The freshly started turn is not itself expired.
    expect(changedOf(resolveTimeout(result.series, 1, LATER, POOL))).toBe(false);
  });

  it("never expires an untimed draft", () => {
    const series = started(makeSeries({ timerSeconds: 0 }));
    expect(changedOf(resolveTimeout(series, 1, LATER, POOL))).toBe(false);
  });
});
