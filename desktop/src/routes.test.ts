import { describe, expect, it } from "vitest";
import {
  GROUP_LABELS,
  railGroups,
  rendersHere,
  ROUTES,
  type DesktopRoute,
  type RouteGroup,
} from "./routes";

/**
 * The rail draws a rule between runs and names each one only to a screen reader (ADR-044).
 * What it draws is decided here, so this is where the drawing is checked.
 */

const stub = (path: string, group: RouteGroup, inRail = true): DesktopRoute => ({
  path,
  label: path,
  // The rail never calls it in these tests; the table only has to be shaped like a table.
  icon: (() => null) as unknown as DesktopRoute["icon"],
  inRail,
  group,
});

describe("railGroups", () => {
  it("puts neighbours that share a group in one run", () => {
    const runs = railGroups([stub("/a", "game"), stub("/b", "game")]);

    expect(runs).toHaveLength(1);
    expect(runs[0].group).toBe("game");
    expect(runs[0].routes.map((r) => r.path)).toEqual(["/a", "/b"]);
  });

  it("starts a new run where the group changes", () => {
    const runs = railGroups([stub("/a", "game"), stub("/b", "overview"), stub("/c", "app")]);

    expect(runs.map((r) => r.group)).toEqual(["game", "overview", "app"]);
  });

  it("leaves out what the rail does not show", () => {
    const runs = railGroups([stub("/a", "game"), stub("/hidden", "game", false)]);

    expect(runs[0].routes.map((r) => r.path)).toEqual(["/a"]);
  });

  // Not merged. A group split across the table is the table having drifted, and drawing it
  // as two runs is how that becomes visible rather than being quietly tidied away.
  it("draws a split group as two runs rather than merging them", () => {
    const runs = railGroups([stub("/a", "game"), stub("/b", "app"), stub("/c", "game")]);

    expect(runs.map((r) => r.group)).toEqual(["game", "app", "game"]);
  });

  it("holds every rail item exactly once", () => {
    const inRail = ROUTES.filter((route) => route.inRail).map((route) => route.path);
    const drawn = railGroups().flatMap((run) => run.routes.map((route) => route.path));

    expect(drawn).toEqual(inRail);
  });
});

describe("the real table", () => {
  it("gives every group a name to say out loud", () => {
    for (const route of ROUTES) {
      expect(GROUP_LABELS[route.group]).toBeTruthy();
    }
  });

  // The rail is the only way to reach a screen without editing the address, so a run that
  // drifted apart would put the same icons in two places on screen.
  it("keeps each group in one run", () => {
    const groups = railGroups().map((run) => run.group);

    expect(new Set(groups).size).toBe(groups.length);
  });
});

describe("rendersHere", () => {
  it("draws a native screen at its own address", () => {
    expect(rendersHere("/settings")).toBe(true);
    expect(rendersHere("/game")).toBe(true);
  });

  // The case that went blank. `/settings/accounts` prefix-matches this app's native
  // `/settings`, and the website's dashboard links there from the empty state an unpaired
  // player lands on first.
  it("hands back a path under a native screen", () => {
    expect(rendersHere("/settings/accounts")).toBe(false);
    expect(rendersHere("/settings/billing")).toBe(false);
    expect(rendersHere("/pairing/anything")).toBe(false);
  });

  // A lifted screen is the website's own component and reads its own parameters, so the
  // subtree is its business and handing it back would take a working screen away.
  it("keeps a path under a lifted screen", () => {
    expect(rendersHere("/matches")).toBe(true);
    expect(rendersHere("/matches/TR1_1234567890")).toBe(true);
    expect(rendersHere("/coaching/some-report-id")).toBe(true);
  });

  it("hands back what the table does not mention at all", () => {
    expect(rendersHere("/pricing")).toBe(false);
    expect(rendersHere("/coaches")).toBe(false);
    expect(rendersHere("/")).toBe(false);
  });
});
