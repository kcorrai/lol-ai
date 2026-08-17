import { describe, it, expect } from "vitest";
import { rankPlayers, type PlayerResults } from "./leaderboardRanking";

function player(
  userId: string,
  solvedGuessCounts: number[],
  lastSolvedAt = new Date("2026-08-17T12:00:00Z")
): PlayerResults {
  return {
    userId,
    displayName: userId,
    profileSlug: userId,
    solvedGuessCounts,
    lastSolvedAt,
  };
}

describe("rankPlayers", () => {
  it("ranks more modes solved above fewer, whatever the guess counts", () => {
    // Solving one puzzle in two must not beat solving six in three each — the
    // board is for a game about solving puzzles, not about a single lucky pick.
    const ranked = rankPlayers([
      player("lucky", [2]),
      player("thorough", [3, 3, 3, 3, 3, 3]),
    ]);
    expect(ranked.map((r) => r.userId)).toEqual(["thorough", "lucky"]);
    expect(ranked[0].modesSolved).toBe(6);
    expect(ranked[0].totalGuesses).toBe(18);
  });

  it("ranks fewer guesses first among players who solved as much", () => {
    const ranked = rankPlayers([player("slow", [5, 5]), player("sharp", [2, 3])]);
    expect(ranked.map((r) => r.userId)).toEqual(["sharp", "slow"]);
  });

  it("breaks a true tie on who finished earlier", () => {
    const ranked = rankPlayers([
      player("later", [3], new Date("2026-08-17T18:00:00Z")),
      player("earlier", [3], new Date("2026-08-17T06:00:00Z")),
    ]);
    expect(ranked.map((r) => r.userId)).toEqual(["earlier", "later"]);
  });

  it("gives players who tie on the score itself the same rank", () => {
    const ranked = rankPlayers([
      player("a", [3], new Date("2026-08-17T06:00:00Z")),
      player("b", [3], new Date("2026-08-17T07:00:00Z")),
      player("c", [4], new Date("2026-08-17T08:00:00Z")),
    ]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  it("leaves a gap after a shared rank rather than renumbering", () => {
    const ranked = rankPlayers([player("a", [2]), player("b", [2]), player("c", [9])]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  it("leaves out anyone who solved nothing", () => {
    const ranked = rankPlayers([player("played", [3]), player("gave-up", [])]);
    expect(ranked.map((r) => r.userId)).toEqual(["played"]);
  });

  it("returns an empty board rather than throwing when nobody has played", () => {
    expect(rankPlayers([])).toEqual([]);
  });

  it("is stable for identical days, so the board does not shuffle on refresh", () => {
    const players = [player("b", [3]), player("a", [3]), player("c", [3])];
    expect(rankPlayers(players)).toEqual(rankPlayers(players));
  });

  it("totals the guesses across solved modes", () => {
    const [entry] = rankPlayers([player("x", [1, 4, 7])]);
    expect(entry.modesSolved).toBe(3);
    expect(entry.totalGuesses).toBe(12);
  });

  it("carries the profile slug through for linking", () => {
    const [entry] = rankPlayers([{ ...player("x", [2]), profileSlug: "kaan" }]);
    expect(entry.profileSlug).toBe("kaan");
  });

  it("does not leak the tiebreak timestamp into the response", () => {
    const [entry] = rankPlayers([player("x", [2])]);
    expect(entry).not.toHaveProperty("lastSolvedAt");
  });
});
