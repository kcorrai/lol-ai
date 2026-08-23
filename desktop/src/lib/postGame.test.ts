import { describe, expect, it } from "vitest";
import type { LiveRead } from "./liveClient/client";
import { gameJustEnded } from "./postGame";

const OK: LiveRead<unknown> = { status: "ok", data: {} };
const NO_GAME: LiveRead<unknown> = { status: "no-game" };
const UNREADABLE: LiveRead<unknown> = { status: "unreadable", reason: "connection refused" };

describe("gameJustEnded", () => {
  it("fires when a game the app was reading disappears", () => {
    expect(gameJustEnded(OK, NO_GAME)).toBe(true);
  });

  // The panel reports a finished game to the website, and the website spends Riot quota
  // pulling it. Everything below is a case that must not spend it.

  it("does not fire on start-up, when there is no previous reading to leave", () => {
    expect(gameJustEnded(null, NO_GAME)).toBe(false);
  });

  it("does not fire while no game is running", () => {
    expect(gameJustEnded(NO_GAME, NO_GAME)).toBe(false);
  });

  it("does not fire while a game is running", () => {
    expect(gameJustEnded(OK, OK)).toBe(false);
  });

  // "The app could not look" is not the same answer as "the match is over", and treating
  // it as one would report a game every time the League client hiccuped.
  it("does not fire when the read fails mid-game", () => {
    expect(gameJustEnded(OK, UNREADABLE)).toBe(false);
  });

  it("does not fire when a failed read resolves to no game", () => {
    expect(gameJustEnded(UNREADABLE, NO_GAME)).toBe(false);
  });

  it("does fire when a game recovers from a failed read and then ends", () => {
    // The sequence a flaky client really produces: ok → unreadable → ok → no-game. Only
    // the last step is the end of a match, and it is the one that fires.
    expect(gameJustEnded(UNREADABLE, OK)).toBe(false);
    expect(gameJustEnded(OK, NO_GAME)).toBe(true);
  });

  it("does not fire when a game starts", () => {
    expect(gameJustEnded(NO_GAME, OK)).toBe(false);
  });
});
