import { useMemo } from "react";
import { HudPanel } from "@/components/layout/HudPanel";
import { PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import { activePlayerOf } from "@/lib/liveMatchup";
import type { AllGameData } from "@/lib/liveClient/schema";
import { eventClock, readTimeline, type TimelineEntry } from "@/lib/timeline";

/**
 * What has already happened, newest first.
 *
 * A record of the match nobody can scroll back through. A player at fourteen minutes knows
 * the dragon went to the other team and usually not when, and "when" is the half that is
 * worth having.
 *
 * It counts nothing down. No respawn, no next objective, no patch constant anywhere behind
 * it — those numbers move between patches, this repository has no verified table of them, and
 * a confidently wrong countdown over a running game is worse than no panel at all.
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
        entries.length > limit ? (
          <span className="font-mono text-[10px] uppercase tracking-label text-text-faint">
            last {limit}
          </span>
        ) : null
      }
    >
      {entries.length === 0 ? (
        <PanelNote>
          Nothing has happened yet. Kills, turrets and objectives land here as they do.
        </PanelNote>
      ) : (
        <ol className="grid gap-px bg-line-1">
          {entries.slice(0, limit).map((entry) => (
            <Row key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
    </HudPanel>
  );
}

/**
 * One row.
 *
 * The player's own rows are marked, and marked by more than colour — a left edge as well as
 * the accent — because a row that is only a different shade is one a player who cannot tell
 * those shades apart never sees.
 */
function Row({ entry }: { entry: TimelineEntry }): React.ReactElement {
  return (
    <li
      className={cn(
        "flex items-baseline gap-3 bg-surface px-3 py-1.5",
        entry.mine && "border-l-2 border-accent pl-[10px]"
      )}
    >
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-text-muted">
        {eventClock(entry.at)}
      </span>
      <span
        className={cn("min-w-0 flex-1 truncate text-sm", entry.mine ? "text-accent" : "text-text")}
      >
        {entry.headline}
      </span>
      {entry.stolen ? (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-label text-danger">
          stolen
        </span>
      ) : null}
    </li>
  );
}
