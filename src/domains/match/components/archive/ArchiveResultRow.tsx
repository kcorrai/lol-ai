"use client";

import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { positionLabel, queueLabel } from "@/domains/match/archive/archiveLabels";
import { cn } from "@/lib/utils";
import type { ArchiveRow } from "@/domains/match/services/matchArchiveService";

/**
 * One match in the results.
 *
 * It links by `matchDbId` rather than the Riot id — `/match/[matchId]` looks the row up by primary
 * key, and handing it Riot's `NA1_123…` would 404 on a match that is very much there.
 */
export function ArchiveResultRow({ row }: { row: ArchiveRow }): React.JSX.Element {
  return (
    <Link
      href={`/match/${row.matchDbId}`}
      className={cn(
        "notch-sm group flex items-center gap-3 border-l-2 bg-surface px-3 py-2.5 transition-colors hover:bg-surface-2",
        row.won ? "border-l-acid-500" : "border-l-danger"
      )}
    >
      <ChampionIcon name={row.championName} size={38} className="shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-fg-1">
          {row.championName}
          <span className="ml-1.5 font-mono text-[10px] uppercase tracking-wide text-fg-4">
            {positionLabel(row.position)}
          </span>
        </p>
        {/* The length is the first thing to go on a phone: at 390px the queue name and the date
            already fill the line, and truncating mid-number reads as a broken row rather than as a
            stat that did not fit. */}
        <p className="truncate font-mono text-[10px] uppercase tracking-wide text-fg-4">
          {queueLabel(row.queueType)} · {formatWhen(row.gameStart)}
          <span className="hidden sm:inline"> · {formatDuration(row.gameDurationSeconds)}</span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-mono text-[13px] tabular-nums text-fg-1">
          {row.kills}
          <span className="text-fg-4">/</span>
          <span className="text-danger">{row.deaths}</span>
          <span className="text-fg-4">/</span>
          {row.assists}
        </p>
        <p className="font-mono text-[10px] tabular-nums text-fg-3">{row.kda.toFixed(2)} KDA</p>
      </div>

      {/* The secondary numbers are the ones people filter on, so they are worth the width they cost —
          but only where there is width to spend. */}
      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-mono text-[11px] tabular-nums text-fg-2">
          {row.cs} CS
          <span className="ml-1 text-fg-4">({row.csPerMinute.toFixed(1)}/m)</span>
        </p>
        <p className="font-mono text-[10px] tabular-nums text-fg-3">{row.visionScore} vision</p>
      </div>

      <span
        className={cn(
          "hidden shrink-0 font-mono text-[10px] uppercase tracking-label md:inline",
          row.won ? "text-acid-500" : "text-danger"
        )}
      >
        {row.won ? "Win" : "Loss"}
      </span>
    </Link>
  );
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "2-digit" });
}
