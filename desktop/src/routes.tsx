import { lazy } from "react";
import { ON_WEBSITE } from "./routesOnWebsite";
import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";
// The website's own icons for the shared items, taken from `navConfig.ts` along with their
// names: an item that is a clipboard in the sidebar and a page in the window is the same
// drift as one that is called two things.
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Crosshair,
  Film,
  Gamepad2,
  History,
  LayoutDashboard,
  Link2,
  Map,
  Medal,
  MessageCircle,
  Search,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Trophy,
  Users,
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
 * What a sidebar item sits under.
 *
 * **These are the website's own section names** (`src/components/layout/navConfig.ts`),
 * plus the two this window has and a browser tab does not. Two products navigating the
 * same information must not disagree about what it is called, and `routes.test.ts` is
 * where that stops being a good intention: it reads the website's table and fails if a
 * shared path is labelled or filed differently here.
 *
 * Collapsed, the sidebar draws a group as a rule between runs and says its name only to a
 * screen reader; expanded, it draws it as a heading, the way the website does. Either way
 * the group's other job is ordering: the array below is read top to bottom.
 */
export type RouteGroup =
  | "game"
  | "overview"
  | "coaching"
  | "performance"
  | "compete"
  | "tools"
  | "esports"
  | "learn"
  | "create"
  | "market"
  | "settings"
  | "app";

/** Verbatim from the website's `NAV_SECTIONS`, except the two it has no reason to have. */
export const GROUP_LABELS: Record<RouteGroup, string> = {
  /** This window's own: a browser tab cannot read the game on port 2999. */
  game: "This game",
  overview: "Overview",
  coaching: "Coaching",
  performance: "My Performance",
  compete: "Compete",
  tools: "Free Tools",
  esports: "Esports",
  learn: "Learn",
  create: "Create",
  market: "Coaching marketplace",
  settings: "Settings",
  /** This window's own: a browser tab has no credential store to pair against. */
  app: "This app",
};

export interface DesktopRoute {
  /** The website's own path. A lifted component links to it and lands back here. */
  path: string;
  label: string;
  icon: LucideIcon;
  /** Native screens render from `App`; lifted ones render from here. */
  Component?: LazyExoticComponent<ComponentType>;
  /** Shown in the sidebar. Not every route is worth a permanent button. */
  inRail: boolean;
  group: RouteGroup;
  /**
   * This row is a place on the website, not a screen here (ADR-044).
   *
   * It has no `Component` and no native screen, and unlike every other row it is in the
   * table *because* it is not covered — so `rendersHere` has to be told, or the exact path
   * would match a route with nothing behind it and the window would go blank, which is the
   * failure `b3f244d6` fixed for `/settings/accounts`.
   */
  onWebsite?: true;
}

// `lazy` per screen rather than one bundle: the dashboard alone pulls in Recharts, and a
// companion window that is usually opened to look at a running game should not pay for it
// on the way in.
const lifted = (load: () => Promise<{ default: ComponentType }>) => lazy(load);

export const ROUTES: readonly DesktopRoute[] = [
  { path: "/game", label: "Game", icon: Gamepad2, inRail: true, group: "game" },
  // This window's own, like `/game`: there is no `/pregame` on the website, because the
  // website has no reason for one. A browser tab is not open during champion select.
  //
  // Above the champion browser and below the game, which is the order the two are wanted in:
  // the pick happens before the match and after everything else.
  { path: "/pregame", label: "Before the game", icon: Crosshair, inRail: true, group: "game" },
  // Second, under the game: it is the only native screen worth opening when there is no
  // match running, which is most of the time this window is on screen.
  //
  // Not "Champions": that is the website's name for `/champion-pool`, and two items in one
  // sidebar cannot carry it. The address is the website's `/champions` — its champion index
  // — and this is the reading of it that fits beside a game: by lane rather than by class,
  // and carrying the build and the counters the window would otherwise have to go and get.
  { path: "/champions", label: "Champion Meta", icon: BarChart3, inRail: true, group: "game" },
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    inRail: true,
    group: "overview",
    Component: lifted(() => import("../../app/(app)/dashboard/PageClient")),
  },
  {
    path: "/coaching",
    label: "Reports",
    icon: ClipboardList,
    inRail: true,
    group: "coaching",
    Component: lifted(() => import("../../app/(app)/coaching/PageClient")),
  },
  // Liftable on paper and a handback in fact, which is why it is written out here rather
  // than sitting with the rest of the site in `routesOnWebsite.ts`: it belongs inside
  // Coaching, in the website's own order, not in a block at the end.
  //
  // The reason is the transport. `/api/riot/{id}/chat` answers with a `text/plain` stream
  // and the bridge between this window and the core carries a JSON body — a reply would
  // arrive all at once or not at all, and the screen is a stream of tokens. The route is
  // also not on `withAuth`, so there is no `deviceAccess` to turn on. Both are fixable and
  // neither is fixable here.
  {
    path: "/coaching/chat",
    label: "Coach Chat",
    icon: MessageCircle,
    inRail: true,
    group: "coaching",
    onWebsite: true,
  },
  {
    path: "/improvement",
    label: "Improvement",
    icon: TrendingUp,
    inRail: true,
    group: "coaching",
    Component: lifted(() => import("../../app/(app)/improvement/PageClient")),
  },
  {
    path: "/otp",
    label: "OTP Assistant",
    icon: Star,
    inRail: true,
    group: "coaching",
    Component: lifted(() => import("../../app/(app)/otp/PageClient")),
  },
  // The website's order within My Performance, item for item.
  {
    path: "/champion-pool",
    label: "Champions",
    icon: Shield,
    inRail: true,
    group: "performance",
    Component: lifted(() => import("../../app/(app)/champion-pool/PageClient")),
  },
  {
    path: "/matches",
    label: "Match Search",
    icon: Search,
    inRail: true,
    group: "performance",
    Component: lifted(() => import("../../app/(app)/matches/PageClient")),
  },
  {
    path: "/analysis",
    label: "Heat Map",
    icon: Map,
    inRail: true,
    group: "performance",
    Component: lifted(() => import("../../app/(app)/analysis/PageClient")),
  },
  {
    path: "/timeline",
    label: "Career Timeline",
    icon: History,
    inRail: true,
    group: "performance",
    Component: lifted(() => import("../../app/(app)/timeline/PageClient")),
  },
  {
    path: "/recap",
    label: "Season Recap",
    icon: Film,
    inRail: true,
    group: "performance",
    Component: lifted(() => import("../../app/(app)/recap/PageClient")),
  },
  {
    path: "/milestone",
    label: "Milestone",
    icon: CalendarDays,
    inRail: true,
    group: "performance",
    Component: lifted(() => import("../../app/(app)/milestone/PageClient")),
  },
  {
    path: "/leaderboard",
    label: "Leaderboard",
    icon: Medal,
    inRail: true,
    group: "compete",
    Component: lifted(() => import("../../app/(app)/leaderboard/PageClient")),
  },
  {
    path: "/achievements",
    label: "Badges",
    icon: Trophy,
    inRail: true,
    group: "compete",
    Component: lifted(() => import("../../app/(app)/achievements/PageClient")),
  },
  // The other handback that is written out here rather than with the rest of the site: it
  // belongs inside Compete, between Badges and what follows.
  //
  // A team has its own shell on the website — `TeamShell` and `TeamSidebar` — and
  // `/teams/[id]` is a different component from `/teams`. A lifted screen answers for
  // everything under its path, so lifting the list would draw the *list* at `/teams/abc`.
  // Covering it means lifting the shell too, which is a screen of its own and not a line in
  // this table.
  {
    path: "/teams",
    label: "Teams",
    icon: Users,
    inRail: true,
    group: "compete",
    onWebsite: true,
  },
  ...ON_WEBSITE,
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

/**
 * Whether this window draws this path itself, or hands it back to the website (ADR-044).
 *
 * Not the same question as `matchRoute`, which answers "what section is this under" and is
 * what the rail wants. The two forms of screen answer for different amounts of the tree:
 *
 * - A **lifted** screen is the website's own component and reads its own parameters, so it
 *   answers for everything under its path — `/matches/TR1_1` is the match list's business.
 * - A **native** screen is hand-built for exactly one address and draws nothing at any other.
 *
 * Asking `matchRoute` alone conflated them, and the case it got wrong was not a corner:
 * `/settings/accounts` prefix-matched this app's native `/settings`, so the handoff did not
 * fire and the native screen did not render either. The window went blank — and the website
 * links there from the dashboard's own "connect an account" empty state, which is the first
 * thing an unpaired player sees.
 */
export function rendersHere(path: string): boolean {
  const route = matchRoute(path);
  if (!route) return false;

  if (route.onWebsite) return false;
  return route.Component ? true : route.path === path;
}
