import { describe, expect, it } from "vitest";
import {
  champSelectSchema,
  enemyChampionIds,
  localChampionId,
  type ChampSelect,
} from "./champSelect";

/** A session in the shape the client publishes, with only what a test moves overridden. */
function session(over: Record<string, unknown> = {}): ChampSelect {
  return champSelectSchema.parse({
    localPlayerCellId: 2,
    myTeam: [
      { cellId: 0, championId: 55, assignedPosition: "jungle" },
      { cellId: 1, championId: 0, assignedPosition: "top" },
      { cellId: 2, championId: 103, assignedPosition: "middle" },
    ],
    theirTeam: [
      { cellId: 5, championId: 238 },
      { cellId: 6, championId: 0 },
    ],
    actions: [[{ championId: 84, completed: true, type: "ban", actorCellId: 0 }]],
    ...over,
  });
}

describe("champSelectSchema", () => {
  it("keeps fields a client update adds rather than failing", () => {
    const parsed = champSelectSchema.parse({ ...session(), somethingRiotAddedLater: 7 });
    expect(parsed["somethingRiotAddedLater"]).toBe(7);
  });

  it("parses a session with none of the optional collections", () => {
    expect(champSelectSchema.safeParse({}).success).toBe(true);
  });
});

describe("localChampionId", () => {
  it("finds the local player's champion through their cell", () => {
    expect(localChampionId(session())).toBe(103);
  });

  it("answers null when nothing is hovered yet", () => {
    // Zero is how the client spells "no champion", and reporting it as one would send a
    // request about a champion that does not exist.
    expect(localChampionId(session({ localPlayerCellId: 1 }))).toBeNull();
  });

  it("answers null when the client has not said which cell is ours", () => {
    const { localPlayerCellId: _dropped, ...withoutCell } = session();
    expect(localChampionId(champSelectSchema.parse(withoutCell))).toBeNull();
  });

  it("answers null when our cell is not on our own team", () => {
    expect(localChampionId(session({ localPlayerCellId: 99 }))).toBeNull();
  });
});

describe("enemyChampionIds", () => {
  it("returns the champions locked in, and not the empty slots", () => {
    expect(enemyChampionIds(session())).toEqual([238]);
  });

  it("returns nothing when the enemy team is not published yet", () => {
    const { theirTeam: _dropped, ...withoutTheirs } = session();
    expect(enemyChampionIds(champSelectSchema.parse(withoutTheirs))).toEqual([]);
  });

  it("carries no player identity out of the session", () => {
    // Riot requires non-party names in ranked champion select to be shown as "Ally 1" and
    // so on. Returning ids alone is what keeps that impossible to get wrong downstream.
    expect(enemyChampionIds(session()).every((id) => typeof id === "number")).toBe(true);
  });
});
