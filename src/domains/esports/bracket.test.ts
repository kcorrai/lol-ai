import { describe, it, expect } from "vitest";
import { bracketLayout, bracketWinner } from "./bracket";
import type { BracketMatch, BracketTeam } from "./types";

function team(code: string, outcome: "win" | "loss" | null = null): BracketTeam {
  return {
    id: `id-${code}`,
    slug: code.toLowerCase(),
    name: code,
    code,
    image: null,
    decided: true,
    gameWins: outcome === "win" ? 3 : 0,
    outcome,
  };
}

const TBD: BracketTeam = {
  id: "0",
  slug: null,
  name: "TBD",
  code: "TBD",
  image: null,
  decided: false,
  gameWins: 0,
  outcome: null,
};

function match(id: string, teams: BracketTeam[]): BracketMatch {
  return { matchId: id, state: "completed", previousMatchIds: [], teams };
}

/** A clean eight-team knockout: four quarters, two semis, a final. */
function knockout(): { matches: BracketMatch[]; times: Map<string, string> } {
  const matches = [
    match("qf1", [team("A", "win"), team("B", "loss")]),
    match("qf2", [team("C", "win"), team("D", "loss")]),
    match("qf3", [team("E", "win"), team("F", "loss")]),
    match("qf4", [team("G", "win"), team("H", "loss")]),
    match("sf1", [team("A", "win"), team("C", "loss")]),
    match("sf2", [team("E", "loss"), team("G", "win")]),
    match("final", [team("A", "win"), team("G", "loss")]),
  ];
  const times = new Map([
    ["qf1", "2026-10-01T09:00:00Z"],
    ["qf2", "2026-10-01T12:00:00Z"],
    ["qf3", "2026-10-02T09:00:00Z"],
    ["qf4", "2026-10-02T12:00:00Z"],
    ["sf1", "2026-10-08T09:00:00Z"],
    ["sf2", "2026-10-09T09:00:00Z"],
    ["final", "2026-10-15T09:00:00Z"],
  ]);
  return { matches, times };
}

describe("bracketLayout", () => {
  it("derives rounds from which teams carried through", () => {
    const { matches, times } = knockout();
    const layout = bracketLayout(matches, times);

    expect(layout.derived).toBe(true);
    expect(layout.rounds.map((round) => round.matches.length)).toEqual([4, 2, 1]);
    expect(layout.rounds[0].matches.map((m) => m.matchId)).toEqual(["qf1", "qf2", "qf3", "qf4"]);
    expect(layout.rounds[2].matches[0].matchId).toBe("final");
  });

  it("names the closing rounds when the shape halves down to one", () => {
    const { matches, times } = knockout();

    expect(bracketLayout(matches, times).rounds.map((r) => r.name)).toEqual([
      "Quarterfinals",
      "Semifinals",
      "Final",
    ]);
  });

  it("leaves rounds unnamed when the shape is not a clean knockout", () => {
    // Five matches that do not halve — a ladder, not a bracket.
    const matches = [
      match("m1", [team("A", "win"), team("B", "loss")]),
      match("m2", [team("A", "loss"), team("C", "win")]),
      match("m3", [team("C", "win"), team("D", "loss")]),
    ];
    const times = new Map([
      ["m1", "2026-06-01T09:00:00Z"],
      ["m2", "2026-06-02T09:00:00Z"],
      ["m3", "2026-06-03T09:00:00Z"],
    ]);

    expect(bracketLayout(matches, times).rounds.every((r) => r.name === null)).toBe(true);
  });

  it("refuses to lay out a draw that has not been made", () => {
    // Worlds publishes its knockout slots months early, all TBD vs TBD.
    const matches = Array.from({ length: 7 }, (_, i) => match(`k${i}`, [TBD, TBD]));
    const layout = bracketLayout(matches, new Map());

    // One round holding everything, and `derived: false` so the caller lists
    // them instead of drawing a bracket with seven first-round games.
    expect(layout.derived).toBe(false);
    expect(layout.rounds).toHaveLength(1);
    expect(layout.rounds[0].matches).toHaveLength(7);
  });

  it("orders by kickoff, not by the order the feed happened to send", () => {
    const { matches, times } = knockout();
    const shuffled = [matches[6], matches[0], matches[4], matches[1]];

    const layout = bracketLayout(shuffled, times);
    expect(layout.rounds[0].matches.map((m) => m.matchId)).toEqual(["qf1", "qf2"]);
  });

  it("keeps feed order for matches the schedule window no longer covers", () => {
    const { matches } = knockout();
    const layout = bracketLayout(matches, new Map());

    // No times at all: continuity still separates the rounds.
    expect(layout.rounds.map((round) => round.matches.length)).toEqual([4, 2, 1]);
  });

  it("handles an empty stage without inventing a round", () => {
    expect(bracketLayout([], new Map())).toEqual({ rounds: [], derived: false });
  });

  it("does not treat a half-decided match as undecided", () => {
    const matches = [
      match("qf1", [team("A", "win"), team("B", "loss")]),
      match("sf1", [team("A"), TBD]),
    ];
    const times = new Map([
      ["qf1", "2026-10-01T09:00:00Z"],
      ["sf1", "2026-10-08T09:00:00Z"],
    ]);

    const layout = bracketLayout(matches, times);
    expect(layout.derived).toBe(true);
    expect(layout.rounds.map((r) => r.matches.map((m) => m.matchId))).toEqual([["qf1"], ["sf1"]]);
  });
});

describe("bracketWinner", () => {
  it("names the winner and stays quiet while a match is undecided", () => {
    expect(bracketWinner(match("m", [team("A", "win"), team("B", "loss")]))?.code).toBe("A");
    expect(bracketWinner(match("m", [TBD, TBD]))).toBeNull();
  });
});
