/**
 * What the top bar offers, as data.
 *
 * It used to be seven flat links, which is the number at which a 62px bar carrying a
 * wordmark, a search box and two calls to action runs out of room — so the eighth thing
 * this product shipped had nowhere to go, and the desktop companion never got announced.
 *
 * Four of the six entries are menus, so a new tool or a new lesson path lands inside a
 * panel that has room for it rather than on the bar that does not. Adding one here is a
 * one-line change with no layout consequence, which is the whole point of the shape.
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
  {
    key: "play",
    label: "Play",
    items: [
      { href: "/draft", label: "Draft room", hint: "Fearless pick/ban, one link, no login" },
      { href: "/esports", label: "Esports", hint: "Live scores and the pro meta" },
      // Multi-search sits here rather than under Tools: it is something you reach for in
      // champion select, next to the draft room, not something you browse on a quiet evening.
      { href: "/tools/multi-search", label: "Multi-search", hint: "Scout all ten, no login" },
    ],
  },
  {
    key: "coaching",
    label: "Coaching",
    items: [
      { href: "/coaching", label: "AI coach", hint: "Your games read, one habit named" },
      { href: "/coaches", label: "Find a coach", hint: "Ranks we checked ourselves" },
      { href: "/teams", label: "Teams", hint: "One dashboard for the roster" },
    ],
  },
  // Flat, and deliberately: this is the thing the site had no way of mentioning, and burying
  // it one click inside a panel would repeat the problem the panels were added to solve.
  { href: "/download", label: "Desktop" },
  { href: "/pricing", label: "Pricing" },
];
