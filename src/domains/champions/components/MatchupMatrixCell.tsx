"use client";

import { cn } from "@/lib/utils";
import type { MatchupCell } from "@/domains/analysis/services/matchupService";

interface Props {
  cell: MatchupCell | undefined;
  onClick: (cell: MatchupCell) => void;
}

function cellColor(wr: number, games: number): string {
  if (games < 3) return "bg-surface-2 text-text-muted";
  if (wr >= 60) return "bg-success/40 text-success";
  if (wr >= 50) return "bg-success/20 text-success";
  if (wr >= 45) return "bg-warning/20 text-warning";
  if (wr >= 40) return "bg-danger/20 text-danger";
  return "bg-danger/40 text-danger";
}

export function MatchupMatrixCell({ cell, onClick }: Props) {
  if (!cell) {
    return (
      <div className="flex h-12 w-16 items-center justify-center rounded text-xs text-text-muted/30">
        —
      </div>
    );
  }

  const lowSample = cell.gamesPlayed < 3;

  return (
    <button
      onClick={() => !lowSample && onClick(cell)}
      title={
        lowSample
          ? `${cell.gamesPlayed}G — yeterli veri yok`
          : `${cell.gamesPlayed}G · KDA ${cell.avgKda}`
      }
      disabled={lowSample}
      className={cn(
        "flex h-12 w-16 flex-col items-center justify-center rounded text-xs font-semibold transition-all",
        lowSample
          ? "cursor-default bg-surface-2 text-text-muted opacity-50"
          : cn(
              "cursor-pointer hover:scale-105 hover:shadow-md",
              cellColor(cell.winRate, cell.gamesPlayed)
            )
      )}
    >
      <span>{lowSample ? "?" : `${cell.winRate}%`}</span>
      <span className="text-[9px] font-normal opacity-75">{cell.gamesPlayed}G</span>
    </button>
  );
}
