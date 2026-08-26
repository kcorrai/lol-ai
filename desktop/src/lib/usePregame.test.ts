import { describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(), isTauri: () => false }));

import { matchupKey } from "./liveMatchup";
import { PREGAME_MODE, pregameRequest } from "./usePregame";

/**
 * The hook needs a DOM and this suite runs in node, so the rules it turns on are functions.
 * Both of them are about spending a request, which is the one thing this screen has to be
 * careful with: `/api/desktop/live-context` is rate limited per device.
 */
describe("pregameRequest", () => {
  it("is nothing until the player has named what they are playing", () => {
    expect(pregameRequest(null, "Darius", "TOP")).toBeNull();
  });

  /**
   * Half an answer now is worth more than a whole one after the timer: a player who knows
   * their champion and not yet the opponent still gets the build, the skill order and their
   * own record on it.
   */
  it("asks without an opponent, which is a shape the request already had", () => {
    expect(pregameRequest("Sett", null, "TOP")).toEqual({
      championName: "Sett",
      opponentChampionName: null,
      position: "TOP",
      gameMode: PREGAME_MODE,
    });
  });

  it("carries the lane as the position, the way a game would", () => {
    expect(pregameRequest("Ahri", "Zed", "MIDDLE")?.position).toBe("MIDDLE");
  });
});

describe("the matchup key a pregame request produces", () => {
  /**
   * The same function the live dashboard keys its one-per-match fetch on. Sharing it is what
   * makes "this is the matchup already on screen" mean the same thing in both places.
   */
  it("changes when either champion changes", () => {
    const base = matchupKey(pregameRequest("Ahri", "Zed", "MIDDLE"));

    expect(matchupKey(pregameRequest("Ahri", "Syndra", "MIDDLE"))).not.toBe(base);
    expect(matchupKey(pregameRequest("Viktor", "Zed", "MIDDLE"))).not.toBe(base);
  });

  it("changes when the lane changes, because the reading is per lane", () => {
    expect(matchupKey(pregameRequest("Sett", "Darius", "TOP"))).not.toBe(
      matchupKey(pregameRequest("Sett", "Darius", "MIDDLE"))
    );
  });

  /** What the cache is for: naming the same matchup twice must not spend a second request. */
  it("is the same for the same matchup named twice", () => {
    expect(matchupKey(pregameRequest("Ahri", "Zed", "MIDDLE"))).toBe(
      matchupKey(pregameRequest("Ahri", "Zed", "MIDDLE"))
    );
  });

  it("tells an unnamed opponent apart from a named one", () => {
    expect(matchupKey(pregameRequest("Ahri", null, "MIDDLE"))).not.toBe(
      matchupKey(pregameRequest("Ahri", "Zed", "MIDDLE"))
    );
  });
});
