import { describe, it, expect } from "vitest";
import { aggregateProMeta, MIN_MEANINGFUL_GAMES } from "./proMeta";
import { gameWinner } from "./gameOutcome";
import type { GameParticipant, GameStats, GameTeamStats, PlayerRole } from "./types";

function participant(
  championId: string,
  participantId: number,
  role: PlayerRole | null = null
): GameParticipant {
  return {
    participantId,
    playerId: null,
    handle: `p${participantId}`,
    fullHandle: `T1 p${participantId}`,
    championId,
    role,
    level: 18,
    kills: 0,
    deaths: 0,
    assists: 0,
    creepScore: 0,
    gold: 0,
    killParticipation: null,
    damageShare: null,
    wardsPlaced: null,
    wardsDestroyed: null,
    finalStats: null,
    items: [],
    runes: null,
    abilities: [],
  };
}

function side(
  sideName: "blue" | "red",
  champions: [string, PlayerRole | null][],
  objectives: { towers: number; inhibitors: number }
): GameTeamStats {
  return {
    side: sideName,
    teamId: `team-${sideName}`,
    gold: 0,
    kills: 0,
    towers: objectives.towers,
    inhibitors: objectives.inhibitors,
    barons: 0,
    dragons: [],
    participants: champions.map(([champion, role], index) =>
      participant(champion, sideName === "blue" ? index + 1 : index + 6, role)
    ),
  };
}

interface GameSpec {
  blue: [string, PlayerRole | null][];
  red: [string, PlayerRole | null][];
  winner?: "blue" | "red" | "undecided";
  patch?: string;
  finished?: boolean;
  lastFrameAt?: string;
}

function game(spec: GameSpec): GameStats {
  const outcome = spec.winner ?? "blue";
  const blueObjectives =
    outcome === "blue" ? { towers: 9, inhibitors: 2 } : { towers: 2, inhibitors: 0 };
  const redObjectives =
    outcome === "red" ? { towers: 9, inhibitors: 2 } : { towers: 2, inhibitors: 0 };
  const tied = { towers: 3, inhibitors: 0 };

  return {
    gameId: "g-1",
    patch: spec.patch ?? "15.20",
    finished: spec.finished ?? true,
    firstFrameAt: "2026-08-16T09:30:00Z",
    lastFrameAt: spec.lastFrameAt ?? "2026-08-16T10:00:00Z",
    durationSeconds: 1800,
    blue: side("blue", spec.blue, outcome === "undecided" ? tied : blueObjectives),
    red: side("red", spec.red, outcome === "undecided" ? tied : redObjectives),
  };
}

const FIVE: [string, PlayerRole | null][] = [
  ["Aatrox", "top"],
  ["Vi", "jungle"],
  ["Azir", "mid"],
  ["Jinx", "bottom"],
  ["Nautilus", "support"],
];

const OTHER: [string, PlayerRole | null][] = [
  ["Gnar", "top"],
  ["Sejuani", "jungle"],
  ["Orianna", "mid"],
  ["Kaisa", "bottom"],
  ["Rakan", "support"],
];

describe("gameWinner", () => {
  it("names the side that broke an inhibitor", () => {
    expect(gameWinner(game({ blue: FIVE, red: OTHER, winner: "blue" }))).toBe("blue");
    expect(gameWinner(game({ blue: FIVE, red: OTHER, winner: "red" }))).toBe("red");
  });

  it("refuses to guess on an unfinished game", () => {
    expect(gameWinner(game({ blue: FIVE, red: OTHER, finished: false }))).toBeNull();
  });

  it("refuses to guess when the final frame shows no separation", () => {
    expect(gameWinner(game({ blue: FIVE, red: OTHER, winner: "undecided" }))).toBeNull();
  });
});

describe("aggregateProMeta", () => {
  it("counts a pick per game and rates it over the sample", () => {
    const meta = aggregateProMeta([
      game({ blue: FIVE, red: OTHER, winner: "blue" }),
      game({ blue: FIVE, red: OTHER, winner: "red" }),
    ]);

    const azir = meta.champions.find((c) => c.championId === "Azir");
    expect(meta.games).toBe(2);
    expect(azir).toMatchObject({ picks: 2, wins: 1, decidedGames: 2, pickRate: 100 });
    expect(azir?.winRate).toBe(50);
  });

  it("counts picks from a game whose winner cannot be derived, but not wins", () => {
    const meta = aggregateProMeta([
      game({ blue: FIVE, red: OTHER, winner: "blue" }),
      game({ blue: FIVE, red: OTHER, winner: "undecided" }),
    ]);

    const azir = meta.champions.find((c) => c.championId === "Azir");
    // Two picks, but only one game contributes to the record.
    expect(azir).toMatchObject({ picks: 2, decidedGames: 1, wins: 1 });
    expect(azir?.winRate).toBe(100);
  });

  it("ignores games that never finished", () => {
    const meta = aggregateProMeta([
      game({ blue: FIVE, red: OTHER }),
      game({ blue: FIVE, red: OTHER, finished: false }),
    ]);

    expect(meta.games).toBe(1);
    expect(meta.champions.find((c) => c.championId === "Azir")?.picks).toBe(1);
  });

  it("orders by picks and names the role a champion is actually played in", () => {
    const meta = aggregateProMeta([
      game({ blue: FIVE, red: OTHER }),
      game({ blue: FIVE, red: [["Azir", "top"], ...OTHER.slice(1)] }),
    ]);

    expect(meta.champions[0].championId).toBe("Azir");
    expect(meta.champions[0].picks).toBe(3);
    // Two mid games against one top game.
    expect(meta.champions[0].topRole).toBe("mid");
    expect(meta.champions[0].roles).toEqual({ mid: 2, top: 1 });
  });

  it("reports the patch range and the most recent game", () => {
    const meta = aggregateProMeta([
      game({ blue: FIVE, red: OTHER, patch: "15.20", lastFrameAt: "2026-08-14T10:00:00Z" }),
      game({ blue: FIVE, red: OTHER, patch: "15.19", lastFrameAt: "2026-08-16T10:00:00Z" }),
    ]);

    expect(meta.patches).toEqual(["15.19", "15.20"]);
    expect(meta.lastGameAt).toBe("2026-08-16T10:00:00Z");
  });

  it("flags a sample too small to read anything into", () => {
    const thin = aggregateProMeta([game({ blue: FIVE, red: OTHER })]);
    expect(thin.thinSample).toBe(true);

    const enough = aggregateProMeta(
      Array.from({ length: MIN_MEANINGFUL_GAMES }, () => game({ blue: FIVE, red: OTHER }))
    );
    expect(enough.thinSample).toBe(false);
  });

  it("returns an empty aggregate rather than dividing by zero", () => {
    expect(aggregateProMeta([])).toMatchObject({
      games: 0,
      champions: [],
      patches: [],
      lastGameAt: null,
      thinSample: true,
    });
  });
});
