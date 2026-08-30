import { useMemo } from "react";
import { Building2, Flame, Landmark, Shield, Skull, Swords, type LucideIcon } from "lucide-react";
import { ChampionTile } from "@/components/hud/ChampionTile";
import { HudPanel, PanelMeta } from "@/components/layout/HudPanel";
import { PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import { activePlayerOf } from "@/lib/liveMatchup";
import type { AllGameData } from "@/lib/liveClient/schema";
import { eventClock, readTimeline, type TimelineEntry, type TimelineKind } from "@/lib/timeline";

const ICONS: Record<TimelineKind, LucideIcon> = {
  dragon: Flame,
  baron: Swords,
  herald: Shield,
  turret: Building2,
  inhibitor: Landmark,
  kill: Skull,
  ace: Swords,
  multikill: Skull,
};

/**
 * What has already happened, newest first.
 *
 * A record of the match nobody can scroll back through. A player at fourteen minutes knows
 * the dragon went to the other team and usually not when, and "when" is the half that is
 * worth having.
 *
 * It counts nothing down. No respawn, no next objective, no patch constant anywhere behind it
 * — those numbers move between patches, this repository has no verified table of them, and a
 * confidently wrong countdown over a running game is worse than no panel at all.
 */
export function TimelinePanel({
  data,
  /** How many rows to draw. The overlay is a glance and the window is a read. */
  limit = 12,
}: {
  data: AllGameData;
  limit?: number;
}): React.ReactElement {
  const me = useMemo(() => activePlayerOf(data), [data]);
  // Recomputed only when the payload changes, which is once a second — but it runs over every
  // event in the game and the list grows all match.
  const entries = useMemo(() => readTimeline(data, me), [data, me]);

  return (
    <HudPanel
      title="So far"
      action={
        <PanelMeta>
          {entries.length} {entries.length === 1 ? "event" : "events"} · newest first
        </PanelMeta>
      }
      bare
    >
      {entries.length === 0 ? (
        <PanelNote>
          Nothing has happened yet. Kills, turrets and objectives land here as they do.
        </PanelNote>
      ) : (
        <ol>
          {entries.slice(0, limit).map((entry, index) => (
            <Row key={entry.id} entry={entry} index={index} />
          ))}
        </ol>
      )}
    </HudPanel>
  );
}

/**
 * One row.
 *
 * The player's own rows are marked by a left edge as well as the accent, because a row that
 * is only a different shade is one a player who cannot tell those shades apart never sees.
 * The same rule puts the icon in a bordered box rather than relying on its colour.
 */
function Row({ entry, index }: { entry: TimelineEntry; index: number }): React.ReactElement {
  const Icon = ICONS[entry.kind];
  const tone = entry.stolen
    ? "danger"
    : entry.mine
      ? "accent"
      : entry.kind === "kill"
        ? "muted"
        : "info";

  const text = {
    accent: "text-accent",
    danger: "text-danger",
    info: "text-info",
    muted: "text-text",
  }[tone];
  const edge = {
    accent: "border-accent",
    danger: "border-danger",
    info: "border-info",
    muted: "border-line-2",
  }[tone];

  return (
    <li
      style={{ animationDelay: `${index * 26}ms` }}
      className={cn(
        "hud-row-in grid grid-cols-[54px_24px_minmax(0,1fr)_max-content] items-center gap-3.5 border-b border-l-2 border-b-line-1 px-4 py-2.5",
        entry.mine ? "border-l-accent" : "border-l-transparent"
      )}
    >
      <span className="font-mono text-[11.5px] tabular-nums text-text-faint">
        {eventClock(entry.at)}
      </span>
      <span
        className={cn("tag-cut grid h-6 w-6 place-items-center border bg-surface-dark", edge, text)}
      >
        <Icon aria-hidden className="h-3.5 w-3.5" />
      </span>
      <span className="flex min-w-0 items-center gap-2">
        {entry.actor ? <ChampionTile champion={entry.actor} size={22} /> : null}
        <span className={cn("min-w-0 truncate text-sm", entry.mine ? "text-accent" : "text-text")}>
          {entry.headline}
        </span>
      </span>
      <span
        className={cn(
          "w-20 text-right font-mono text-[9px] font-bold uppercase tracking-[0.16em]",
          entry.stolen ? "text-danger" : "text-accent"
        )}
      >
        {entry.tag}
      </span>
    </li>
  );
}
