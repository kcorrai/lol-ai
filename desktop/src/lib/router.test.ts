import { describe, expect, it } from "vitest";
import { parseHash } from "./router";

/**
 * The fragment is this window's address bar (ADR-043). Paths in it are the website's own,
 * so a component lifted from the website links to the address it always did.
 */
describe("parseHash", () => {
  it("reads a bare path", () => {
    expect(parseHash("#/dashboard")).toEqual({ path: "/dashboard", search: "" });
  });

  it("splits the query off, because the archive keeps its filters there", () => {
    expect(parseHash("#/matches?champion=Ahri&limit=20")).toEqual({
      path: "/matches",
      search: "?champion=Ahri&limit=20",
    });
  });

  it("keeps dynamic segments whole", () => {
    expect(parseHash("#/match/TR1_123456").path).toBe("/match/TR1_123456");
  });

  /**
   * A window opened fresh has no fragment at all, and the first thing a companion to a
   * running game should show is the game.
   */
  it("lands on the game screen with no fragment", () => {
    expect(parseHash("").path).toBe("/game");
    expect(parseHash("#").path).toBe("/game");
    expect(parseHash("#/").path).toBe("/game");
  });

  it("tolerates a fragment written without its leading slash", () => {
    expect(parseHash("#dashboard").path).toBe("/dashboard");
  });

  /** A query with no path is not an address; it should not become one. */
  it("does not lose the path to an empty query", () => {
    expect(parseHash("#/matches?")).toEqual({ path: "/matches", search: "?" });
  });
});
