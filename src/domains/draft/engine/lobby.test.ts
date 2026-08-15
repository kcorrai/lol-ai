import { describe, expect, it } from "vitest";
import { gameOf, makeSeries, play, POOL, started, T0 } from "@/test/draftFixtures";
import { applyBlueTeam, applyGameResult, applyReady } from "./lobby";
import { seriesStatus } from "./series";
import { createGame, createGames, otherTeam } from "./stateUtils";
import type { DraftSeriesState } from "./draft.types";

function readyBoth(series: DraftSeriesState, gameNumber = 1): DraftSeriesState {
  const blue = applyReady(series, gameNumber, "BLUE", true, T0);
  if (!blue.ok) throw new Error(blue.reason);
  const red = applyReady(blue.series, gameNumber, "RED", true, T0);
  if (!red.ok) throw new Error(red.reason);
  return red.series;
}

describe("applyReady", () => {
  it("waits for both sides before starting", () => {
    const blue = applyReady(makeSeries(), 1, "BLUE", true, T0);
    expect(blue.ok).toBe(true);
    if (!blue.ok) return;
    expect(gameOf(blue.series).phase).toBe("LOBBY");
    expect(gameOf(blue.series).turnStartedAt).toBeNull();

    const both = readyBoth(makeSeries());
    expect(gameOf(both).phase).toBe("IN_PROGRESS");
    expect(gameOf(both).step).toBe(0);
    expect(gameOf(both).turnStartedAt).toBe(T0);
  });

  it("is a no-op when the flag is already set", () => {
    const once = applyReady(makeSeries(), 1, "BLUE", true, T0);
    if (!once.ok) throw new Error(once.reason);
    const twice = applyReady(once.series, 1, "BLUE", true, T0);
    expect(twice).toEqual({ ok: true, series: once.series, changed: false });
  });

  it("cannot be toggled once the draft is running", () => {
    expect(applyReady(readyBoth(makeSeries()), 1, "BLUE", false, T0)).toEqual({
      ok: false,
      reason: "not-in-lobby",
    });
  });
});

describe("applyBlueTeam", () => {
  it("seats a team on blue before the ready check", () => {
    const moved = applyBlueTeam(makeSeries(), 1, 2);
    expect(moved.ok).toBe(true);
    if (moved.ok) expect(gameOf(moved.series).blueTeam).toBe(2);
  });

  it("is locked once the draft starts", () => {
    expect(applyBlueTeam(readyBoth(makeSeries()), 1, 2)).toEqual({
      ok: false,
      reason: "not-in-lobby",
    });
  });

  it("alternates sides down the series by default", () => {
    expect(createGames(4).map((g) => g.blueTeam)).toEqual([1, 2, 1, 2]);
    expect(createGame(3).blueTeam).toBe(1);
    expect(otherTeam(1)).toBe(2);
  });
});

describe("applyGameResult", () => {
  it("records a winner only once the draft is finished", () => {
    expect(applyGameResult(started(makeSeries()), 1, "BLUE")).toEqual({
      ok: false,
      reason: "not-complete",
    });

    const done = play(started(makeSeries()), POOL);
    const recorded = applyGameResult(done, 1, "BLUE");
    expect(recorded.ok).toBe(true);
    if (!recorded.ok) return;
    expect(gameOf(recorded.series).winnerSide).toBe("BLUE");
    // Idempotent — recording the same winner twice changes nothing.
    expect(applyGameResult(recorded.series, 1, "BLUE")).toEqual({
      ok: true,
      series: recorded.series,
      changed: false,
    });
  });
});

describe("seriesStatus", () => {
  it("credits a win to the team that was on the winning side", () => {
    const series = makeSeries({ gameCount: 2 });
    const g1 = applyGameResult(play(readyBoth(series), POOL), 1, "BLUE");
    if (!g1.ok) throw new Error(g1.reason);

    const status = seriesStatus(g1.series);
    expect(status.completedGames).toBe(1);
    expect(status.team1Wins).toBe(1); // game 1 seats team 1 on blue
    expect(status.team2Wins).toBe(0);
    expect(status.activeGameNumber).toBe(2);
    expect(status.isComplete).toBe(false);
  });

  it("completes when every game has finished drafting", () => {
    const series = makeSeries({ gameCount: 1 });
    const status = seriesStatus(play(readyBoth(series), POOL));
    expect(status.isComplete).toBe(true);
    expect(status.activeGameNumber).toBe(1);
  });
});
