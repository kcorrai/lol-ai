import { BarChart3, Crosshair, Gamepad2, LayoutDashboard, Star, TrendingUp } from "lucide-react";

/**
 * The contents of `WindowVisual`, kept next to it rather than inside it.
 *
 * Only because of the 200-line rule in CLAUDE.md §3.3 — the drawing is one thing and reads as
 * one. What is here is the parts of it that are lists and the one part that is a component:
 * the scoreboard, which is two of the same thing side by side.
 */

export interface RailSection {
  group: string;
  items: readonly { label: string; icon: React.ElementType }[];
}

/**
 * The sidebar, read off `desktop/src/routes.tsx` — its `GROUP_LABELS` and the `inRail`
 * entries under them. Not every group: the window has seven and this is a picture, so it
 * stops after Coaching, which is where the point being made already is.
 */
export const RAIL: readonly RailSection[] = [
  {
    group: "This game",
    items: [
      { label: "Game", icon: Gamepad2 },
      { label: "Before the game", icon: Crosshair },
      { label: "Champion Meta", icon: BarChart3 },
    ],
  },
  { group: "Overview", items: [{ label: "Dashboard", icon: LayoutDashboard }] },
  {
    group: "Coaching",
    items: [
      { label: "Reports", icon: TrendingUp },
      { label: "OTP Assistant", icon: Star },
    ],
  },
];

export interface Line {
  name: string;
  you?: boolean;
  kda: string;
  cs: string;
}

export const BLUE: readonly Line[] = [
  { name: "Darius", you: true, kda: "4 / 1 / 3", cs: "148" },
  { name: "Lee Sin", kda: "2 / 3 / 6", cs: "96" },
  { name: "Orianna", kda: "3 / 2 / 4", cs: "163" },
];

export const RED: readonly Line[] = [
  { name: "Sett", kda: "1 / 4 / 2", cs: "121" },
  { name: "Vi", kda: "3 / 2 / 3", cs: "88" },
  { name: "Ahri", kda: "4 / 1 / 2", cs: "157" },
];

/**
 * What has happened, newest first, with a time against it.
 *
 * Times that have passed, never a countdown: `ObjectivesPanel.tsx` refuses to run one because
 * respawn timers move between patches and a confidently wrong clock is worse than no clock.
 * A picture that showed one would be advertising the thing the app declines to do.
 */
export const EVENTS: readonly { at: string; what: string; mine: boolean }[] = [
  { at: "18:24", what: "Dragon — Blue", mine: true },
  { at: "16:02", what: "Mid turret — Blue", mine: true },
  { at: "14:47", what: "Herald — Blue", mine: true },
  { at: "11:38", what: "Top turret — Red", mine: false },
];

/** One team's half of the scoreboard, on `desktop/src/components/game/Scoreboard.tsx`'s grid. */
export function Side({
  team,
  kills,
  rows,
  className,
}: {
  team: "Blue" | "Red";
  kills: string;
  rows: readonly Line[];
  className?: string;
}): React.ReactElement {
  const mine = team === "Blue";
  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3 border-b border-line-1 bg-ink-700 px-3.5 py-2">
        <span
          className={`font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] ${
            mine ? "text-accent" : "text-danger"
          }`}
        >
          {team}
        </span>
        <span className="font-mono text-[10.5px] tabular-nums text-text-muted">{kills} kills</span>
      </div>
      <div className="grid gap-px bg-line-1">
        {rows.map((row) => (
          <div
            key={row.name}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 bg-surface px-3.5 py-2"
          >
            <span
              className={`min-w-0 truncate text-[11.5px] ${row.you ? "text-accent" : "text-text"}`}
            >
              {row.name}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-text-body">{row.kda}</span>
            <span className="w-8 text-right font-mono text-[10.5px] tabular-nums text-text-faint">
              {row.cs}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
