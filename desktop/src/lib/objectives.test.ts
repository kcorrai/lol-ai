import { describe, expect, it } from "vitest";
import { countObjectives, otherTeam, share } from "./objectives";
import type { TimelineEntry, TimelineKind } from "./timeline";

function entry(kind: TimelineKind, team: TimelineEntry["team"], id = 1): TimelineEntry {
  return {
    id,
    at: 600,
    kind,
    headline: kind,
    actor: null,
    team,
    stolen: false,
    mine: false,
    tag: null,
  };
}

describe("countObjectives", () => {
  it("counts each side's objectives separately", () => {
    const count = countObjectives([
      entry("dragon", "ORDER", 1),
      entry("dragon", "ORDER", 2),
      entry("dragon", "CHAOS", 3),
      entry("baron", "CHAOS", 4),
      entry("turret", "ORDER", 5),
    ]);

    expect(count.ORDER.dragon).toBe(2);
    expect(count.CHAOS.dragon).toBe(1);
    expect(count.CHAOS.baron).toBe(1);
    expect(count.ORDER.turret).toBe(1);
  });

  /** A kill is not an objective, however much of the game it decides. */
  it("counts only the rows that are objectives", () => {
    const count = countObjectives([
      entry("kill", "ORDER", 1),
      entry("ace", "ORDER", 2),
      entry("multikill", "ORDER", 3),
    ]);

    expect(count.ORDER).toEqual({ dragon: 0, herald: 0, baron: 0, turret: 0, inhibitor: 0 });
  });

  /**
   * A turret taken by minions has no killer to match against the player list, so the
   * timeline reports no side. Guessing one would put a point on a scoreboard nobody scored.
   */
  it("counts an objective with no side for neither side", () => {
    const count = countObjectives([entry("turret", null)]);

    expect(count.ORDER.turret).toBe(0);
    expect(count.CHAOS.turret).toBe(0);
  });

  it("reads a game where nothing has happened as nil-nil", () => {
    const count = countObjectives([]);

    expect(count.ORDER.baron).toBe(0);
    expect(count.CHAOS.inhibitor).toBe(0);
  });
});

describe("share", () => {
  it("splits the bar by the two counts", () => {
    expect(share(3, 1)).toBe(75);
    expect(share(1, 1)).toBe(50);
    expect(share(0, 4)).toBe(0);
  });

  /**
   * Nil-nil is even, not empty. An empty bar reads as a side that has lost something it
   * never had.
   */
  it("reads nothing yet as even rather than as nothing", () => {
    expect(share(0, 0)).toBe(50);
  });
});

describe("otherTeam", () => {
  it("names the other side", () => {
    expect(otherTeam("ORDER")).toBe("CHAOS");
    expect(otherTeam("CHAOS")).toBe("ORDER");
  });
});
