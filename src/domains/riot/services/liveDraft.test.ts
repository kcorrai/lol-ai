import { describe, it, expect } from "vitest";
import { assignLanes, SMITE_SPELL_ID, type LaneFrequency, type LiveParticipant } from "./liveDraft";
import type { CanonicalPosition } from "@/domains/meta/types";

const FLASH = 4;

const player = (championId: number, teamId: number, spell1 = FLASH): LiveParticipant => ({
  championId,
  teamId,
  spell1Id: spell1,
  spell2Id: FLASH,
});

// championId → name, and the lane split we pretend the meta snapshot reports.
const KEYS = new Map<number, string>([
  [1, "Ahri"],
  [2, "Sylas"],
  [3, "LeeSin"],
  [4, "Jinx"],
  [5, "Thresh"],
  [6, "Garen"],
]);

const freq = (
  entries: [number, [CanonicalPosition, number][]][],
): LaneFrequency =>
  new Map(entries.map(([id, lanes]) => [id, lanes.map(([position, games]) => ({ position, games }))]));

const STANDARD = freq([
  [1, [["MIDDLE", 9000]]],
  [2, [["MIDDLE", 5000], ["TOP", 1000]]],
  [3, [["JUNGLE", 9000]]],
  [4, [["BOTTOM", 9000]]],
  [5, [["UTILITY", 9000]]],
  [6, [["TOP", 9000]]],
]);

describe("assignLanes", () => {
  it("gives the jungle to whoever carries Smite", () => {
    // Ahri is a 100%-mid champion, but Smite settles it.
    const result = assignLanes([player(1, 100, SMITE_SPELL_ID)], STANDARD, KEYS);

    expect(result.blue.JUNGLE).toBe("Ahri");
    expect(result.blue.MIDDLE).toBeUndefined();
  });

  it("reads Smite in either spell slot", () => {
    const second: LiveParticipant = { championId: 1, teamId: 100, spell1Id: FLASH, spell2Id: SMITE_SPELL_ID };

    expect(assignLanes([second], STANDARD, KEYS).blue.JUNGLE).toBe("Ahri");
  });

  it("fills both teams from one game", () => {
    const game = [
      player(6, 100), player(3, 100, SMITE_SPELL_ID), player(1, 100), player(4, 100), player(5, 100),
      player(6, 200), player(3, 200, SMITE_SPELL_ID), player(2, 200), player(4, 200), player(5, 200),
    ];

    const { blue, red } = assignLanes(game, STANDARD, KEYS);

    expect(blue).toEqual({ TOP: "Garen", JUNGLE: "LeeSin", MIDDLE: "Ahri", BOTTOM: "Jinx", UTILITY: "Thresh" });
    expect(red).toEqual({ TOP: "Garen", JUNGLE: "LeeSin", MIDDLE: "Sylas", BOTTOM: "Jinx", UTILITY: "Thresh" });
  });

  it("gives a contested lane to the champion more concentrated in it", () => {
    // Both play mid; Ahri is mid-only, Sylas splits mid/top. Sylas should yield.
    const result = assignLanes([player(1, 100), player(2, 100)], STANDARD, KEYS);

    expect(result.blue.MIDDLE).toBe("Ahri");
    expect(result.blue.TOP).toBe("Sylas");
  });

  it("does not depend on the order participants arrive in", () => {
    const forward = assignLanes([player(1, 100), player(2, 100)], STANDARD, KEYS);
    const reversed = assignLanes([player(2, 100), player(1, 100)], STANDARD, KEYS);

    expect(reversed).toEqual(forward);
  });

  it("still seats a champion the snapshot has no lane data for", () => {
    const result = assignLanes([player(1, 100), player(6, 100)], freq([[1, [["MIDDLE", 9000]]]]), KEYS);

    expect(result.blue.MIDDLE).toBe("Ahri");
    // Garen has no data — it takes whatever lane is left rather than vanishing.
    expect(Object.values(result.blue)).toContain("Garen");
  });

  it("leaves a slot empty for a champion it cannot name", () => {
    // An id missing from Data Dragon can't be rendered by the draft form.
    const result = assignLanes([player(99, 100)], STANDARD, KEYS);

    expect(result.blue).toEqual({});
  });

  it("returns empty teams for a game with no participants", () => {
    expect(assignLanes([], STANDARD, KEYS)).toEqual({ blue: {}, red: {} });
  });
});
