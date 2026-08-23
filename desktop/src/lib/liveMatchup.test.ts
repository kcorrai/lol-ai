import { describe, expect, it } from "vitest";
import sample from "./liveClient/__fixtures__/allgamedata.sample.json";
import { allGameDataSchema, type AllGameData } from "./liveClient/schema";
import { activePlayerOf, describeMatchup, laneOpponentOf, matchupKey } from "./liveMatchup";

/**
 * Built on Riot's own published sample, so the shape these functions are handed is the
 * shape the game client really sends. Only the fields under test are replaced.
 */
function game(
  players: Array<Record<string, unknown>>,
  active: Record<string, unknown>,
  gameMode = "CLASSIC"
): AllGameData {
  const base = sample.allPlayers[0];
  return allGameDataSchema.parse({
    ...sample,
    activePlayer: { ...sample.activePlayer, riotId: undefined, ...active },
    allPlayers: players.map((p) => ({ ...base, riotId: undefined, ...p })),
    gameData: { ...sample.gameData, gameMode },
  });
}

const ME = { championName: "Ahri", team: "ORDER", position: "MIDDLE", summonerName: "Kaan" };
const OPPONENT = {
  championName: "Zed",
  team: "CHAOS",
  position: "MIDDLE",
  summonerName: "Zed guy",
};
const ELSEWHERE = { championName: "Jinx", team: "CHAOS", position: "BOTTOM", summonerName: "adc" };

describe("activePlayerOf", () => {
  it("finds the player by the modern riot id", () => {
    const data = game(
      [
        { ...ME, riotId: "Kaan#TR1" },
        { ...OPPONENT, riotId: "Zed#EUW" },
      ],
      { riotId: "Kaan#TR1" }
    );
    expect(activePlayerOf(data)?.championName).toBe("Ahri");
  });

  it("finds the player by summoner name on a client that emits no riot id", () => {
    // Riot's own published sample is still this shape.
    const data = game([ME, OPPONENT], { summonerName: "Kaan" });
    expect(activePlayerOf(data)?.championName).toBe("Ahri");
  });

  // Pairing a `riotId` against a `summonerName` would be a guess about how Riot spells one
  // in terms of the other, and a wrong guess reads the player's history against a champion
  // they are not laning against.
  it("does not match a riot id against a summoner name", () => {
    const data = game([{ ...ME, summonerName: "Kaan" }], { riotId: "Kaan#TR1" });
    expect(activePlayerOf(data)).toBeNull();
  });

  it("answers null when the active player is not among the ten", () => {
    const data = game([OPPONENT], { summonerName: "Kaan" });
    expect(activePlayerOf(data)).toBeNull();
  });

  it("parses Riot's published sample as one player who is the active one", () => {
    const data = allGameDataSchema.parse(sample);
    expect(activePlayerOf(data)?.championName).toBe("Annie");
  });
});

describe("laneOpponentOf", () => {
  it("takes the champion in the same lane on the other team", () => {
    const data = game([ME, OPPONENT, ELSEWHERE], { summonerName: "Kaan" });
    const me = activePlayerOf(data)!;
    expect(laneOpponentOf(data, me)?.championName).toBe("Zed");
  });

  it("never takes a team mate in the same lane", () => {
    const data = game([ME, { ...OPPONENT, team: "ORDER", summonerName: "duo" }], {
      summonerName: "Kaan",
    });
    const me = activePlayerOf(data)!;
    expect(laneOpponentOf(data, me)).toBeNull();
  });

  // Routine, not a fault: the client leaves the position empty for every ARAM player.
  it("answers null when the client resolved no lane", () => {
    const data = game(
      [
        { ...ME, position: "" },
        { ...OPPONENT, position: "" },
      ],
      {
        summonerName: "Kaan",
      }
    );
    const me = activePlayerOf(data)!;
    expect(laneOpponentOf(data, me)).toBeNull();
  });

  it("answers null when the lane holds two enemies rather than one", () => {
    const data = game(
      [ME, OPPONENT, { ...OPPONENT, championName: "Yasuo", summonerName: "second mid" }],
      { summonerName: "Kaan" }
    );
    const me = activePlayerOf(data)!;
    // Picking one would be choosing which enemy to read the player's record against.
    expect(laneOpponentOf(data, me)).toBeNull();
  });
});

describe("describeMatchup", () => {
  it("describes a normal lane", () => {
    const data = game([ME, OPPONENT, ELSEWHERE], { summonerName: "Kaan" });

    expect(describeMatchup(data)).toEqual({
      championName: "Ahri",
      opponentChampionName: "Zed",
      position: "MIDDLE",
      gameMode: "CLASSIC",
    });
  });

  it("describes an ARAM game as a champion with no lane", () => {
    const data = game(
      [
        { ...ME, position: "" },
        { ...OPPONENT, position: "" },
      ],
      { summonerName: "Kaan" },
      "ARAM"
    );

    // Still worth asking: the habits do not depend on a lane.
    expect(describeMatchup(data)).toEqual({
      championName: "Ahri",
      opponentChampionName: null,
      position: null,
      gameMode: "ARAM",
    });
  });

  it("answers null when the app cannot tell which player it is watching", () => {
    expect(describeMatchup(game([OPPONENT], { summonerName: "Kaan" }))).toBeNull();
  });
});

describe("matchupKey", () => {
  it("is stable across the polls of one game", () => {
    const data = game([ME, OPPONENT], { summonerName: "Kaan" });
    // The same game read a second later — gold and clock have moved, the matchup has not.
    const later = game([{ ...ME, level: 9 }, OPPONENT], { summonerName: "Kaan" });

    expect(matchupKey(describeMatchup(data))).toBe(matchupKey(describeMatchup(later)));
  });

  it("changes when the lane does", () => {
    const zed = game([ME, OPPONENT], { summonerName: "Kaan" });
    const yasuo = game([ME, { ...OPPONENT, championName: "Yasuo" }], { summonerName: "Kaan" });

    expect(matchupKey(describeMatchup(zed))).not.toBe(matchupKey(describeMatchup(yasuo)));
  });

  it("is null when there is nothing to ask about", () => {
    expect(matchupKey(null)).toBeNull();
  });

  // A lane and a mode are different questions even for the same pair of champions.
  it("separates the same pair in a different mode", () => {
    const classic = game([ME, OPPONENT], { summonerName: "Kaan" }, "CLASSIC");
    const flex = game([ME, OPPONENT], { summonerName: "Kaan" }, "ARAM");

    expect(matchupKey(describeMatchup(classic))).not.toBe(matchupKey(describeMatchup(flex)));
  });
});
