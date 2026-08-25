import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Gamepad2,
  Link2,
  LayoutDashboard,
  ScrollText,
  Settings,
  Swords,
  Trophy,
} from "lucide-react";

/**
 * Every address this window answers (ADR-043).
 *
 * Two kinds, deliberately kept in one table so the rail and the router read from the same
 * list and cannot disagree about what exists.
 *
 * **Native** screens are this app's own. They are the ones that need the Rust core for
 * something no website page could do — reading the game on port 2999, holding the keychain
 * — and they are hand-built because they have to be.
 *
 * **Lifted** screens are the website's own client components, rendered here unchanged.
 * Their data arrives through `apiBridge`, their links through the `next/*` shims, and their
 * styling through the shared stylesheet (ADR-039). Adding one is a line in this table,
 * a prefix in `proxy.rs`, and `deviceAccess: true` on the routes behind it — which is the
 * whole point of ADR-043, and the difference between covering the website's 108 pages and
 * rewriting them.
 */

/**
 * What a rail item sits under.
 *
 * The rail is icon-only and cannot show these as headings — a companion window is narrow
 * and the whole reason it stays 56px wide is that every pixel is one the player is not
 * spending on the game. So a group is drawn as a rule between runs of icons, and named only
 * to a screen reader. Its real job is ordering: the array below is read top to bottom, and
 * an item's group is what decides where it belongs in it.
 */
export type RouteGroup = "game" | "overview" | "coaching" | "performance" | "app";

/** Said aloud where the rail can only draw a line. */
export const GROUP_LABELS: Record<RouteGroup, string> = {
  game: "This game",
  overview: "Overview",
  coaching: "Coaching",
  performance: "My performance",
  app: "This app",
};

export interface DesktopRoute {
  /** The website's own path. A lifted component links to it and lands back here. */
  path: string;
  label: string;
  icon: LucideIcon;
  /** Native screens render from `App`; lifted ones render from here. */
  Component?: LazyExoticComponent<ComponentType>;
  /** Shown in the rail. Not every route is worth a permanent button. */
  inRail: boolean;
  group: RouteGroup;
}

// `lazy` per screen rather than one bundle: the dashboard alone pulls in Recharts, and a
// companion window that is usually opened to look at a running game should not pay for it
// on the way in.
const lifted = (load: () => Promise<{ default: ComponentType }>) => lazy(load);

export const ROUTES: readonly DesktopRoute[] = [
  { path: "/game", label: "Game", icon: Gamepad2, inRail: true, group: "game" },
  // Second, under the game: it is the only native screen worth opening when there is no
  // match running, which is most of the time this window is on screen.
  { path: "/champions", label: "Champions", icon: Swords, inRail: true, group: "game" },
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    inRail: true,
    group: "overview",
    Component: lifted(() => import("../../app/(app)/dashboard/PageClient")),
  },
  {
    path: "/matches",
    label: "Matches",
    icon: ScrollText,
    inRail: true,
    group: "performance",
    Component: lifted(() => import("../../app/(app)/matches/PageClient")),
  },
  {
    path: "/achievements",
    label: "Achievements",
    icon: Trophy,
    inRail: true,
    group: "performance",
    Component: lifted(() => import("../../app/(app)/achievements/PageClient")),
  },
  { path: "/pairing", label: "Pairing", icon: Link2, inRail: true, group: "app" },
  { path: "/settings", label: "Settings", icon: Settings, inRail: true, group: "app" },
];

/** One run of rail items that share a group, in the order the table lists them. */
export interface RailGroup {
  group: RouteGroup;
  routes: DesktopRoute[];
}

/**
 * The rail's items, in runs.
 *
 * Built by walking the table in order rather than by collecting each group's members. The
 * array *is* the ordering, so a group whose items were split across it draws as two runs —
 * which is the table saying out loud that it has drifted, rather than this quietly tidying
 * it up and hiding the drift.
 */
export function railGroups(routes: readonly DesktopRoute[] = ROUTES): RailGroup[] {
  const runs: RailGroup[] = [];

  for (const route of routes) {
    if (!route.inRail) continue;

    const last = runs[runs.length - 1];
    if (last && last.group === route.group) {
      last.routes.push(route);
    } else {
      runs.push({ group: route.group, routes: [route] });
    }
  }

  return runs;
}

/**
 * The route a path belongs to, or undefined.
 *
 * Longest prefix wins, so `/match/TR1_1` finds `/match` rather than `/` — and an exact
 * path always beats a prefix. Dynamic segments are not parsed here: the lifted components
 * that need one read it from `useParams`, which the shim fills from this match.
 */
export function matchRoute(path: string): DesktopRoute | undefined {
  const exact = ROUTES.find((route) => route.path === path);
  if (exact) return exact;

  return ROUTES.filter((route) => path.startsWith(`${route.path}/`)).sort(
    (a, b) => b.path.length - a.path.length
  )[0];
}
