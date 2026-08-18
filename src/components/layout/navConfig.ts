import {
  LayoutDashboard,
  Gamepad2,
  CreditCard,
  UserCircle,
  Shield,
  MessageCircle,
  Star,
  Users,
  ClipboardList,
  TrendingUp,
  Trophy,
  Map,
  Film,
  Lock,
  Bot,
  Medal,
  CalendarDays,
  Swords,
  Layers,
  BookOpen,
  Snowflake,
  Radio,
  Handshake,
  GraduationCap,
  History,
  Radio as RadioIcon,
} from "lucide-react";

export interface NavItemConfig {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  /** `data-tour` hook consumed by the guided onboarding (guideSteps.ts). */
  tourId?: string;
  /** External-ish routes that live outside the app route group open in a new tab. */
  newTab?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItemConfig[];
}

// Grouped "Play" navigation. Splitting the old 12-item flat list into intent-based
// sections keeps the sidebar scannable (TASK-236). Tour ids are preserved verbatim so the
// forced onboarding journey keeps finding its targets.
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", tourId: "nav-dashboard" },
    ],
  },
  {
    label: "Coaching",
    items: [
      { href: "/coaching", icon: ClipboardList, label: "Reports", tourId: "nav-reports" },
      {
        href: "/coaching/chat",
        icon: MessageCircle,
        label: "Coach Chat",
        tourId: "nav-coach-chat",
      },
      { href: "/improvement", icon: TrendingUp, label: "Improvement", tourId: "nav-improvement" },
      { href: "/otp", icon: Star, label: "OTP Assistant", tourId: "nav-otp" },
    ],
  },
  {
    label: "My Performance",
    items: [
      { href: "/champion-pool", icon: Shield, label: "Champions", tourId: "nav-champions" },
      { href: "/analysis", icon: Map, label: "Heat Map" },
      { href: "/timeline", icon: History, label: "Career Timeline" },
      { href: "/recap", icon: Film, label: "Season Recap" },
      { href: "/milestone", icon: CalendarDays, label: "Milestone" },
    ],
  },
  {
    label: "Compete",
    items: [
      { href: "/leaderboard", icon: Medal, label: "Leaderboard", tourId: "nav-leaderboard" },
      { href: "/achievements", icon: Trophy, label: "Badges", tourId: "nav-badges" },
      { href: "/teams", icon: Users, label: "Teams" },
    ],
  },
  {
    label: "Free Tools",
    items: [
      { href: "/tools/counter-picker", icon: Swords, label: "Counter Picker", tourId: "nav-tools" },
      { href: "/tools/matchup", icon: Users, label: "Matchup Analyzer" },
      { href: "/tools/draft-analyzer", icon: Layers, label: "Draft Analyzer" },
      { href: "/tools/tier-list", icon: Trophy, label: "Tier List" },
      { href: "/builds", icon: BookOpen, label: "Champion Builds" },
      { href: "/aram/tier-list", icon: Snowflake, label: "ARAM Tier List" },
      { href: "/meta", icon: TrendingUp, label: "Patch Meta" },
    ],
  },
  {
    label: "Esports",
    items: [{ href: "/esports", icon: Radio, label: "Live & Schedule" }],
  },
  // The Academy is its own section with its own shell too (LA-21): the sidebar is the
  // way in, the curriculum itself does not belong in a dashboard nav.
  {
    label: "Learn",
    items: [{ href: "/academy", icon: GraduationCap, label: "Academy" }],
  },
  // One link out to the coaching section, which has its own shell — the same
  // shape as Esports. A coach console belongs in this sidebar about as much as
  // a shop's till belongs on its shopfront, so the entry point is here and the
  // section is not.
  // The Streamer Kit produces URLs that get pasted into OBS and into a chat
  // bot, so it is a place you go to set things up rather than a place you read.
  {
    label: "Create",
    items: [{ href: "/creator", icon: RadioIcon, label: "Streamer Kit" }],
  },
  {
    label: "Coaching marketplace",
    items: [{ href: "/coaches", icon: Handshake, label: "Find a coach" }],
  },
];

export const NAV_SETTINGS: NavItemConfig[] = [
  { href: "/settings/accounts", icon: Gamepad2, label: "Accounts", tourId: "nav-accounts" },
  { href: "/settings/billing", icon: CreditCard, label: "Billing" },
  { href: "/settings/profile", icon: UserCircle, label: "Profile", tourId: "nav-profile" },
  { href: "/settings/privacy", icon: Lock, label: "Privacy" },
  { href: "/settings/discord", icon: Bot, label: "Discord", tourId: "nav-discord" },
];

// Every navigable href, used for longest-prefix active-state disambiguation.
export const ALL_NAV_HREFS: string[] = [
  ...NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.href)),
  ...NAV_SETTINGS.map((i) => i.href),
];
