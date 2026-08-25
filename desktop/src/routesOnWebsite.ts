import {
  BookOpen,
  Bot,
  CreditCard,
  Gamepad2,
  GraduationCap,
  Handshake,
  Layers,
  Lock,
  MonitorDown,
  Radio,
  Snowflake,
  Swords,
  TrendingUp,
  Trophy,
  UserCircle,
  Users,
} from "lucide-react";
// Type-only, so the cycle between this file and `routes.tsx` is erased before it runs.
import type { DesktopRoute } from "./routes";

/**
 * The rest of the website, in this window's sidebar (ADR-044).
 *
 * Every one of these is a place on the site rather than a screen here, and every one is in
 * the table anyway — so the sidebar carries the website's own sections rather than a subset
 * of them. The player sees the whole product and is told, on the way, which parts of it
 * open in a browser. None of it costs a page: `OnTheWebsite` names the path and opens it,
 * and `onWebsite` is what keeps `rendersHere` from claiming an address it cannot draw.
 *
 * They are here rather than lifted for two different reasons, and the second is the
 * stronger one:
 *
 * **Free Tools, Esports, Academy and Find a coach cannot be lifted as they stand.** They
 * are `async` server components that call domain services directly and carry `revalidate`;
 * turning them into client components would cost the website the ISR and the search ranking
 * those public pages exist for. That is a cost paid by the product that earns the traffic,
 * to save a click in the one that sits beside a game.
 *
 * **Settings must not be lifted.** `proxy.rs` refuses to carry a device token to anything
 * that changes a credential, and ADR-038 is why: a token left in a credential store on a
 * machine that may be shared or resold must not be able to change a password or spend
 * money. These open in a browser the player is sitting in front of, which is the point
 * rather than a shortcoming.
 *
 * Names, sections and icons are the website's own, like the rest of the table —
 * `routes.test.ts` reads `navConfig.ts` and fails if one of them drifts.
 */
export const ON_WEBSITE: readonly DesktopRoute[] = [
  {
    path: "/tools/counter-picker",
    label: "Counter Picker",
    icon: Swords,
    inRail: true,
    group: "tools",
    onWebsite: true,
  },
  {
    path: "/tools/matchup",
    label: "Matchup Analyzer",
    icon: Users,
    inRail: true,
    group: "tools",
    onWebsite: true,
  },
  {
    path: "/tools/draft-analyzer",
    label: "Draft Analyzer",
    icon: Layers,
    inRail: true,
    group: "tools",
    onWebsite: true,
  },
  {
    path: "/tools/tier-list",
    label: "Tier List",
    icon: Trophy,
    inRail: true,
    group: "tools",
    onWebsite: true,
  },
  {
    path: "/builds",
    label: "Champion Builds",
    icon: BookOpen,
    inRail: true,
    group: "tools",
    onWebsite: true,
  },
  {
    path: "/aram/tier-list",
    label: "ARAM Tier List",
    icon: Snowflake,
    inRail: true,
    group: "tools",
    onWebsite: true,
  },
  {
    path: "/meta",
    label: "Patch Meta",
    icon: TrendingUp,
    inRail: true,
    group: "tools",
    onWebsite: true,
  },
  {
    path: "/esports",
    label: "Live & Schedule",
    icon: Radio,
    inRail: true,
    group: "esports",
    onWebsite: true,
  },
  {
    path: "/academy",
    label: "Academy",
    icon: GraduationCap,
    inRail: true,
    group: "learn",
    onWebsite: true,
  },
  {
    path: "/creator",
    label: "Streamer Kit",
    icon: Radio,
    inRail: true,
    group: "create",
    onWebsite: true,
  },
  {
    path: "/coaches",
    label: "Find a coach",
    icon: Handshake,
    inRail: true,
    group: "market",
    onWebsite: true,
  },
  {
    path: "/settings/accounts",
    label: "Accounts",
    icon: Gamepad2,
    inRail: true,
    group: "settings",
    onWebsite: true,
  },
  {
    path: "/settings/billing",
    label: "Billing",
    icon: CreditCard,
    inRail: true,
    group: "settings",
    onWebsite: true,
  },
  {
    path: "/settings/profile",
    label: "Profile",
    icon: UserCircle,
    inRail: true,
    group: "settings",
    onWebsite: true,
  },
  {
    path: "/settings/privacy",
    label: "Privacy",
    icon: Lock,
    inRail: true,
    group: "settings",
    onWebsite: true,
  },
  {
    path: "/settings/discord",
    label: "Discord",
    icon: Bot,
    inRail: true,
    group: "settings",
    onWebsite: true,
  },
  {
    path: "/settings/desktop",
    label: "Desktop app",
    icon: MonitorDown,
    inRail: true,
    group: "settings",
    onWebsite: true,
  },
];
