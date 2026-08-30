import { describe, expect, it } from "vitest";
import sample from "./liveClient/__fixtures__/allgamedata.sample.json";
import { allGameDataSchema, type AllGameData, type LivePlayer } from "./liveClient/schema";
import { MIN_MINUTES_FOR_RATE, minutesElapsed, readPerformance } from "./livePerformance";
import type { LiveBaseline, LiveChallenge } from "../../../src/domains/desktop/contract";

/** Riot's own sample with the clock and one player's scores moved, and nothing else. */
function game(seconds: number, scores: Partial<LivePlayer["scores"]> = {}): AllGameData {
  const base = sample.allPlayers[0];
  return allGameDataSchema.parse({
    ...sample,
    allPlayers: [{ ...base, scores: { ...base.scores, ...scores } }, ...sample.allPlayers.slice(1)],
    gameData: { ...sample.gameData, gameTime: seconds },
  });
}

function me(data: AllGameData): LivePlayer {
  const player = data.allPlayers[0];
  if (!player) throw new Error("fixture has no players");
  return player;
}

const BASELINE: LiveBaseline = {
  games: 20,
  csPerMin: 7,
  deaths: 5,
  visionScore: 20,
  kda: 3,
};

function challenge(metric: string, targetValue: number): LiveChallenge {
  return { id: `c-${metric}`, metric, targetValue, description: `${metric} goal` };
}

describe("minutesElapsed", () => {
  it("converts Riot's float seconds to minutes", () => {
    expect(minutesElapsed(game(600))).toBe(10);
  });

  it("never goes negative, however the client spells the loading screen", () => {
    expect(minutesElapsed(game(-22))).toBe(0);
  });
});

describe("readPerformance", () => {
  it("reads all four metrics once the game has run long enough", () => {
    const data = game(600, { creepScore: 60, deaths: 2, wardScore: 11, kills: 3, assists: 3 });
    const metrics = readPerformance(data, me(data), BASELINE, []).map((r) => r.metric);
    expect(metrics).toEqual(["cs_per_min", "deaths", "vision_score", "kda"]);
  });

  it("computes CS per minute from the clock, not from a guess", () => {
    const data = game(600, { creepScore: 62 });
    const cs = readPerformance(data, me(data), null, []).find((r) => r.metric === "cs_per_min");
    expect(cs?.value).toBe(6.2);
  });

  it("leaves CS per minute out entirely before the rate means anything", () => {
    const data = game(MIN_MINUTES_FOR_RATE * 60 - 1, { creepScore: 4 });
    const metrics = readPerformance(data, me(data), BASELINE, []).map((r) => r.metric);
    expect(metrics).not.toContain("cs_per_min");
  });

  it("still reports the counted metrics in the first minute", () => {
    const data = game(30, { deaths: 1 });
    const deaths = readPerformance(data, me(data), BASELINE, []).find((r) => r.metric === "deaths");
    expect(deaths?.value).toBe(1);
  });

  it("computes KDA the way the rest of the product does, dividing by at least one", () => {
    const data = game(600, { kills: 4, assists: 2, deaths: 0 });
    const kda = readPerformance(data, me(data), null, []).find((r) => r.metric === "kda");
    expect(kda?.value).toBe(6);
  });

  it("reads vision off wardScore, which is what the live client publishes", () => {
    const data = game(600, { wardScore: 14.5 });
    const vision = readPerformance(data, me(data), null, []).find(
      (r) => r.metric === "vision_score"
    );
    expect(vision?.value).toBe(15);
  });
});

describe("comparison against the player's own average", () => {
  it("calls more CS than usual an improvement", () => {
    const data = game(600, { creepScore: 90 });
    const cs = readPerformance(data, me(data), BASELINE, []).find((r) => r.metric === "cs_per_min");
    expect(cs?.vsBaseline).toBe("above");
  });

  it("calls fewer deaths than usual an improvement, not a decline", () => {
    const data = game(600, { deaths: 1 });
    const deaths = readPerformance(data, me(data), BASELINE, []).find((r) => r.metric === "deaths");
    expect(deaths?.vsBaseline).toBe("above");
  });

  it("calls more deaths than usual a decline", () => {
    const data = game(600, { deaths: 9 });
    const deaths = readPerformance(data, me(data), BASELINE, []).find((r) => r.metric === "deaths");
    expect(deaths?.vsBaseline).toBe("below");
  });

  it("treats a hair either side of the average as the same game", () => {
    const data = game(600, { creepScore: 70 });
    const cs = readPerformance(data, me(data), BASELINE, []).find((r) => r.metric === "cs_per_min");
    expect(cs?.vsBaseline).toBe("even");
  });

  it("says nothing at all when there is no baseline to say it against", () => {
    const data = game(600, { creepScore: 90 });
    const cs = readPerformance(data, me(data), null, []).find((r) => r.metric === "cs_per_min");
    expect(cs?.baseline).toBeNull();
    expect(cs?.vsBaseline).toBe("unknown");
  });
});

describe("comparison against an active challenge", () => {
  it("carries the target for a metric a challenge covers", () => {
    const data = game(600, { deaths: 2 });
    const deaths = readPerformance(data, me(data), BASELINE, [challenge("deaths", 4)]).find(
      (r) => r.metric === "deaths"
    );
    expect(deaths?.target).toBe(4);
    expect(deaths?.vsTarget).toBe("above");
  });

  it("reports a missed target as missed", () => {
    const data = game(600, { deaths: 7 });
    const deaths = readPerformance(data, me(data), BASELINE, [challenge("deaths", 4)]).find(
      (r) => r.metric === "deaths"
    );
    expect(deaths?.vsTarget).toBe("below");
  });

  it("leaves target unknown for metrics no challenge covers", () => {
    const data = game(600, { creepScore: 60 });
    const cs = readPerformance(data, me(data), BASELINE, [challenge("deaths", 4)]).find(
      (r) => r.metric === "cs_per_min"
    );
    expect(cs?.target).toBeNull();
    expect(cs?.vsTarget).toBe("unknown");
  });

  it("ignores a challenge on something a running game cannot measure", () => {
    const data = game(600, { creepScore: 60 });
    const readings = readPerformance(data, me(data), BASELINE, [challenge("win_streak", 3)]);
    expect(readings.every((r) => r.target === null)).toBe(true);
  });
});
