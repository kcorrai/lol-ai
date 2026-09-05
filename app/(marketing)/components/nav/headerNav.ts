/**
 * What the top bar offers, as data.
 *
 * It used to be seven flat links, which is the number at which a 62px bar carrying a
 * wordmark, a search box and two calls to action runs out of room — so the eighth thing
 * this product shipped had nowhere to go, and the desktop companion never got announced.
 *
 * Two of the six entries are menus, so a new tool or a new lesson path lands inside a
 * panel that has room for it rather than on the bar that does not. Adding one here is a
 * one-line change with no layout consequence, which is the whole point of the shape.
 *
 * The four flat entries are the exception that proves it: a destination goes on the bar
 * itself only when the bar is the thing announcing it, rather than one more place it can
 * be found. That is true of pricing and of the coach marketplace, and it is now true of
 * the draft room and esports — a panel labelled "Play" made a visitor click to find out
 * that the site had a draft room at all, which is the one thing about it worth saying.
 *
 * Marketing's own names, not `navConfig.ts`'s: the sidebar labels a screen for somebody who
 * already pays for it, and this labels it for somebody deciding whether to. The two drift
 * apart on purpose — the same rule `ArsenalPanels.tsx` states for the landing page.
 */

export interface HeaderLink {
  href: string;
  label: string;
  /** One line under the label inside a menu panel. Omitted on the bar's flat links. */
  hint?: string;
}

export interface HeaderMenu {
  label: string;
  /** Anchors the panel's `aria-labelledby` and its element ids. */
  key: string;
  items: readonly HeaderLink[];
}

export type HeaderEntry = HeaderMenu | HeaderLink;

export function isMenu(entry: HeaderEntry): entry is HeaderMenu {
  return "items" in entry;
}

export const HEADER_NAV: readonly HeaderEntry[] = [
  {
    key: "tools",
    label: "Tools",
    items: [
      { href: "/tools/counter-picker", label: "Counter picker", hint: "Who beats what, by lane" },
      { href: "/tools/tier-list", label: "Tier list", hint: "Every role, rebuilt each patch" },
      { href: "/tools/draft-analyzer", label: "Draft analyzer", hint: "Both comps graded" },
      { href: "/tools/matchup", label: "Matchup analyzer", hint: "One lane, head to head" },
      { href: "/builds", label: "Champion builds", hint: "Runes, items, skill order" },
      { href: "/aram/tier-list", label: "ARAM tier list", hint: "Howling Abyss only" },
      { href: "/meta", label: "Patch meta report", hint: "This patch's winners and losers" },
      { href: "/quiz", label: "LaneIQ Daily", hint: "Eight puzzles, new every day" },
    ],
  },
  {
    key: "learn",
    label: "Learn",
    items: [
      { href: "/academy", label: "Academy", hint: "61 lessons, each ending in a drill" },
      { href: "/academy/roles", label: "Role paths", hint: "Top, jungle, mid, ADC, support" },
      { href: "/champions", label: "Champions", hint: "Abilities, stats, skins, matchups" },
    ],
  },
  // What the "Play" panel used to hide, on the bar instead — esports first, then the draft
  // room, in the order they sit to the right of Learn.
  //
  // Both are destinations rather than categories: neither has a second page to group with,
  // so the panel was a click that bought nothing but a label. Multi-search was the third
  // item and is gone from the bar entirely; the page still stands and the footer and the
  // tools index still point at it.
  { href: "/esports", label: "Esports" },
  { href: "/draft", label: "Draft room" },
  // The coach marketplace, on the bar rather than inside a panel.
  //
  // This was a three-item "Coaching" menu: the AI coach, the marketplace, and Teams. The
  // other two are argued at length elsewhere — the AI coach is what four of the landing
  // page's first five sections are about and is in the footer's Product column, and Teams
  // is a pricing tier with its own section at `/pricing#teams`. Neither needed a bar entry;
  // the human marketplace, which the site otherwise mentions once, did.
  //
  // A flat link and not a one-item panel, which `headerNav.test.ts` forbids for good
  // reason: the click would buy nothing. "Coaches" rather than "Find a coach" because the
  // bar's other words are one each, and it is the narrower of the two on a row that has
  // already had its calls to action clipped once.
  { href: "/coaches", label: "Coaches" },
  // The desktop app is deliberately *not* here. It used to be a flat link on the bar, which
  // was better than the panel it came from and still left it reading as the sixth of six
  // words in a row of grey type. It is now a bordered control next to the calls to action
  // (`DownloadCta.tsx`) — the same reasoning that took it out of a panel, applied once more.
  { href: "/pricing", label: "Pricing" },
];
