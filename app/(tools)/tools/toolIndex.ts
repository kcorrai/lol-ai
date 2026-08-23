import {
  Target,
  Swords,
  Users,
  Layers,
  Trophy,
  BookOpen,
  Snowflake,
  TrendingUp,
  Radio,
  Brain,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";

export interface ToolEntry {
  href: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  /**
   * Which figure from the meta snapshot this row is entitled to show.
   *
   * A tool only carries a stat when the hub already knows a true one — a row
   * with nothing to say leaves the column empty rather than inventing a number
   * to fill it.
   */
  stat?: "champions" | "patch" | "updated";
}

export interface ToolGroup {
  title: string;
  note: string;
  tools: ToolEntry[];
}

/** The flagship, promoted out of the grid and given the hero slot. */
export const FEATURED: ToolEntry = {
  href: "/draft",
  title: "Draft Room",
  description:
    "Run a full pick/ban with your team in one link. Live advice on the turn in front of you, fearless series supported.",
  Icon: Target,
};

/** Grouped by the job the visitor came to do, not by which page ships them. */
export const TOOL_GROUPS: ToolGroup[] = [
  {
    title: "Before you lock in",
    note: "Draft and matchup decisions",
    tools: [
      {
        href: "/tools/counter-picker",
        title: "Counter picker",
        description: "The best champions to counter any pick, ranked by real win rate.",
        Icon: Swords,
        stat: "champions",
      },
      {
        href: "/tools/matchup",
        title: "Matchup analyzer",
        description: "Two champions head to head — who wins the lane and at what minute.",
        Icon: Users,
        stat: "champions",
      },
      {
        href: "/tools/draft-analyzer",
        title: "Draft analyzer",
        description: "Any 5v5 comp's damage, frontline, scaling and lane matchups.",
        Icon: Layers,
      },
      {
        href: "/tools/multi-search",
        title: "Multi-search",
        description: "Paste champion select and read every player's rank and pool at once.",
        Icon: ScanSearch,
      },
    ],
  },
  {
    title: "What's strong right now",
    note: "Rebuilt every patch",
    tools: [
      {
        href: "/tools/tier-list",
        title: "Tier list",
        description: "The strongest champions per lane this patch, by win rate.",
        Icon: Trophy,
        stat: "champions",
      },
      {
        href: "/builds",
        title: "Champion builds",
        description: "Runes, items and skill order with the highest win rate.",
        Icon: BookOpen,
        stat: "updated",
      },
      {
        href: "/aram/tier-list",
        title: "ARAM tier list",
        description: "Separate dataset — ARAM balance changes applied.",
        Icon: Snowflake,
      },
      {
        href: "/meta",
        title: "Patch meta report",
        description: "The biggest winners and losers of the current patch.",
        Icon: TrendingUp,
        stat: "patch",
      },
    ],
  },
  {
    title: "What the pros do",
    note: "Live from the esports feed",
    tools: [
      {
        href: "/esports",
        title: "Esports",
        description: "Live scores, schedule and results from every pro league.",
        Icon: Radio,
      },
      {
        href: "/esports/champions",
        title: "Pro champion meta",
        description: "What pro teams are actually picking, with pick and win rates.",
        Icon: Swords,
      },
      {
        href: "/draft",
        title: "Draft room",
        description: "Run a full pick/ban with your team. Fearless series in one link.",
        Icon: Target,
      },
    ],
  },
  {
    title: "For the fun of it",
    note: "New every day at midnight UTC",
    tools: [
      {
        href: "/quiz",
        title: "LaneIQ Daily",
        description:
          "Six champion puzzles a day — ability icons, splash crops, redacted lore, voice lines and emoji.",
        Icon: Brain,
      },
    ],
  },
];

/** Every distinct tool the hub links to, for the "Tools" count in the hero. */
export const TOOL_COUNT: number = new Set(
  [FEATURED, ...TOOL_GROUPS.flatMap((g) => g.tools)].map((t) => t.href)
).size;
