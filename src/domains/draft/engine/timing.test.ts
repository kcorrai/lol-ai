import { describe, expect, it } from "vitest";
import { gameOf, makeSeries, play, POOL, started, T0 } from "@/test/draftFixtures";
import { hasExpired, remainingMs, turnDeadlineMs } from "./timing";

const T0_MS = Date.parse(T0);

describe("turn timing", () => {
  it("computes a deadline from the turn's start", () => {
    const series = started(makeSeries({ timerSeconds: 30 }));
    expect(turnDeadlineMs(series, gameOf(series))).toBe(T0_MS + 30_000);
  });

  it("counts down and floors at zero", () => {
    const series = started(makeSeries({ timerSeconds: 30 }));
    const game = gameOf(series);
    expect(remainingMs(series, game, T0_MS)).toBe(30_000);
    expect(remainingMs(series, game, T0_MS + 25_000)).toBe(5_000);
    expect(remainingMs(series, game, T0_MS + 90_000)).toBe(0);
  });

  it("expires exactly on the deadline, not before", () => {
    const series = started(makeSeries({ timerSeconds: 30 }));
    const game = gameOf(series);
    expect(hasExpired(series, game, T0_MS + 29_999)).toBe(false);
    expect(hasExpired(series, game, T0_MS + 30_000)).toBe(true);
  });

  it("has no deadline when the series is untimed", () => {
    const series = started(makeSeries({ timerSeconds: 0 }));
    const game = gameOf(series);
    expect(turnDeadlineMs(series, game)).toBeNull();
    expect(remainingMs(series, game, T0_MS + 999_999)).toBeNull();
    expect(hasExpired(series, game, T0_MS + 999_999)).toBe(false);
  });

  it("has no deadline in the lobby or after the draft finishes", () => {
    const lobby = makeSeries();
    expect(turnDeadlineMs(lobby, gameOf(lobby))).toBeNull();

    const done = play(started(makeSeries()), POOL);
    expect(turnDeadlineMs(done, gameOf(done))).toBeNull();
    expect(hasExpired(done, gameOf(done), T0_MS + 999_999)).toBe(false);
  });
});
