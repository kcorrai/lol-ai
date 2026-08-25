import { describe, expect, it } from "vitest";
import {
  GROUP_LABELS,
  railGroups,
  rendersHere,
  ROUTES,
  type DesktopRoute,
  type RouteGroup,
} from "./routes";
import { NAV_SECTIONS, NAV_SETTINGS } from "@/components/layout/navConfig";

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

  // A row that is in the table *because* it is not covered. Without `onWebsite` the exact
  // path matches a route with no component and no native screen, and the window goes blank
  // — the same failure b3f244d6 fixed for a path under a native screen.
  it("hands back a row that is only in the table to be listed", () => {
    expect(rendersHere("/builds")).toBe(false);
    expect(rendersHere("/tools/tier-list")).toBe(false);
    expect(rendersHere("/esports")).toBe(false);
    expect(rendersHere("/settings/billing")).toBe(false);
  });

  it("hands back what the table does not mention at all", () => {
    expect(rendersHere("/pricing")).toBe(false);
    expect(rendersHere("/coaches")).toBe(false);
    expect(rendersHere("/")).toBe(false);
  });
});

/**
 * The two nav tables, held together.
 *
 * `src/components/layout/navConfig.ts` on the website and `routes.tsx` here were written
 * independently and drifted: `/champion-pool` was "Champions" there and "Champion pool"
 * here, `/matches` was "Match Search" and "Matches", `/achievements` was "Badges" filed
 * under Compete and "Achievements" filed under My performance. Nothing caught it, because
 * nothing was looking.
 *
 * This is what looks. It reads the website's own table — the alias layer resolves
 * `@/components/layout/navConfig` to it, which is exactly what that layer is for — and
 * fails if a screen both products navigate to is called, filed or drawn differently in one
 * of them. A deliberate change is then a change to the website's table, which is where the
 * two products agree what things are named.
 */
describe("the website's nav and this one", () => {
  const website = new Map<string, { label: string; section: string; icon: unknown }>();
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      website.set(item.href, { label: item.label, section: section.label, icon: item.icon });
    }
  }
  for (const item of NAV_SETTINGS) {
    website.set(item.href, { label: item.label, section: "Settings", icon: item.icon });
  }

  const shared = ROUTES.filter((route) => website.has(route.path));

  // The one that makes the floor above redundant, and it is kept anyway: this says *which*
  // rows are missing, and it is the reason the sidebar carries the whole website rather
  // than a subset of it (ADR-044). A row here does not have to render in the window — most
  // of them hand back — but it has to be listed, or the player is looking at a product with
  // sections quietly missing from it and no way to tell which.
  it("carries every row of the website's sidebar", () => {
    const missing = [...website.keys()].filter(
      (href) => !ROUTES.some((route) => route.path === href)
    );

    expect(missing).toEqual([]);
  });

  it("has screens in common at all", () => {
    // The sidebar carries the website's own sections now, so most of its table is shared.
    // The floor is here so the three below cannot pass by matching nothing at all, which
    // is how a lock quietly stops being one.
    expect(shared.length).toBeGreaterThanOrEqual(24);
  });

  it("calls them what the website calls them", () => {
    for (const route of shared) {
      expect([route.path, route.label]).toEqual([route.path, website.get(route.path)?.label]);
    }
  });

  it("files them under the section the website files them under", () => {
    for (const route of shared) {
      expect([route.path, GROUP_LABELS[route.group]]).toEqual([
        route.path,
        website.get(route.path)?.section,
      ]);
    }
  });

  it("draws them with the website's icon", () => {
    for (const route of shared) {
      expect([route.path, route.icon]).toEqual([route.path, website.get(route.path)?.icon]);
    }
  });

  // The two groups a browser tab has no reason to have. Everything else has to be a name
  // the website's sidebar already uses, or the vocabulary has grown a third dialect.
  it("invents no section the website does not have", () => {
    const websiteSections = new Set([...NAV_SECTIONS.map((s) => s.label), "Settings"]);
    for (const [group, label] of Object.entries(GROUP_LABELS)) {
      if (group === "game" || group === "app") continue;
      expect([group, websiteSections.has(label)]).toEqual([group, true]);
    }
  });
});
