"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { cn } from "@/lib/utils";
import type { BanEntry } from "../types/otp.types";

interface BanPriorityProps {
  bans: BanEntry[];
}

const PRIORITY_STYLES: Record<1 | 2 | 3, string> = {
  1: "bg-danger/15 text-danger border-danger/30",
  2: "bg-warning/15 text-warning border-warning/30",
  3: "bg-warning/15 text-warning border-warning/30",
};

export function BanPriority({ bans }: BanPriorityProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-text">Ban Priorities</h3>
      <div className="space-y-2">
        {bans.map((ban) => (
          <div
            key={ban.champion}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                PRIORITY_STYLES[ban.priority]
              )}
            >
              #{ban.priority}
            </span>
            <ChampionIcon name={ban.champion} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">{ban.champion}</p>
              <p className="truncate text-xs text-text-muted">{ban.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
