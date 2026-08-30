import { TrendingDown, TrendingUp } from "lucide-react";
import { ChampionTile } from "@/components/hud/ChampionTile";
import { HudPanel, PanelMeta } from "@/components/layout/HudPanel";
import type { DesktopCounter } from "@/lib/champions";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/uiLocale";

/**
 * The lanes this champion wins and the ones it loses, side by side.
 *
 * `subjectWinRate` is the subject's own rate in **both** columns — under 50 on the left,
 * 50 or over on the right — so a number does not change meaning halfway across the panel.
 * The bar is the distance from even rather than the rate itself, because that is what the
 * columns are actually ranked on and a bar drawn from zero would be half full for every row.
 */
export function ChampionMatchups({
  counteredBy,
  goodInto,
}: {
  counteredBy: readonly DesktopCounter[];
  goodInto: readonly DesktopCounter[];
}): React.ReactElement {
  return (
    <HudPanel title="Matchups" action={<PanelMeta>Lane win rate · this patch</PanelMeta>} bare>
      <div className="grid xl:grid-cols-2">
        <Column
          label="Struggles into"
          icon={TrendingDown}
          matchups={counteredBy}
          tone="bad"
          className="border-b border-line-1 xl:border-b-0 xl:border-r"
        />
        <Column label="Beats" icon={TrendingUp} matchups={goodInto} tone="good" />
      </div>
    </HudPanel>
  );
}

function Column({
  label,
  icon: Icon,
  matchups,
  tone,
  className,
}: {
  label: string;
  icon: typeof TrendingUp;
  matchups: readonly DesktopCounter[];
  tone: "good" | "bad";
  className?: string;
}): React.ReactElement {
  const colour = tone === "good" ? "text-accent" : "text-danger";
  const fill = tone === "good" ? "bg-accent" : "bg-danger";

  return (
    <div className={cn("min-w-0 p-4", className)}>
      <p className={cn("mb-3.5 flex items-center gap-2.5", colour)}>
        <Icon aria-hidden className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">{label}</span>
      </p>

      {matchups.length === 0 ? (
        <p className="py-5 text-[13.5px] text-text-faint">Not enough games in this lane.</p>
      ) : (
        <ul className="grid gap-0.5">
          {matchups.map((matchup, index) => (
            <li
              key={matchup.championKey}
              className="hud-row-in grid grid-cols-[28px_minmax(0,1fr)_max-content] items-center gap-3 border-b border-line-1 px-2.5 py-2"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <ChampionTile champion={matchup.championKey} size={28} />
              <span className="min-w-0 truncate text-[13.5px] text-text">{matchup.name}</span>
              <span className="flex items-center justify-end gap-2.5">
                <span aria-hidden className="block h-1 w-11 bg-surface-dark">
                  <span
                    className={cn("hud-bar block h-full", fill)}
                    style={{
                      width: `${Math.min(100, Math.abs(matchup.subjectWinRate - 50) * 8)}%`,
                      animationDelay: `${index * 50}ms`,
                    }}
                  />
                </span>
                <span className={cn("w-12 text-right font-mono text-[13px] tabular-nums", colour)}>
                  {matchup.subjectWinRate.toFixed(1)}%
                </span>
                <span className="w-12 text-right font-mono text-[10.5px] tabular-nums text-text-faint">
                  {formatCount(matchup.games)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
