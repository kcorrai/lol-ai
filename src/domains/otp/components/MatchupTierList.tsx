"use client";

import { useState } from "react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { cn } from "@/lib/utils";
import type { OtpAnalysis, OtpMatchupEntry } from "../types/otp.types";

interface MatchupTierListProps {
  tierList: OtpAnalysis["matchupTierList"];
}

const TIER_CONFIG = {
  easy: { label: "Easy", border: "border-accent/40", text: "text-accent" },
  medium: { label: "Even", border: "border-warning/40", text: "text-warning" },
  hard: { label: "Hard", border: "border-danger/40", text: "text-danger" },
} as const;

function MatchupCard({ entry, tier }: { entry: OtpMatchupEntry; tier: keyof typeof TIER_CONFIG }) {
  const [expanded, setExpanded] = useState(false);
  const config = TIER_CONFIG[tier];

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className={cn(
        "w-full rounded-lg border p-2 text-left transition-colors hover:bg-surface-2",
        config.border
      )}
    >
      <div className="flex items-center gap-2">
        <ChampionIcon name={entry.opponent} size={32} />
        <p className="flex-1 truncate text-xs font-medium text-text">{entry.opponent}</p>
      </div>
      {expanded && (
        <div className="mt-2 space-y-1 border-t border-border pt-2">
          <p className="text-xs text-text-muted">{entry.summary}</p>
          <p className={cn("text-xs font-medium", config.text)}>Tip: {entry.keyTip}</p>
        </div>
      )}
    </button>
  );
}

export function MatchupTierList({ tierList }: MatchupTierListProps) {
  const columns: Array<{ key: keyof typeof TIER_CONFIG; entries: OtpMatchupEntry[] }> = [
    { key: "easy", entries: tierList.easy },
    { key: "medium", entries: tierList.medium },
    { key: "hard", entries: tierList.hard },
  ];

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-text">Matchup Tier List</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {columns.map(({ key, entries }) => (
          <div key={key} className="space-y-2">
            <p className={cn("text-center text-xs font-semibold", TIER_CONFIG[key].text)}>
              {TIER_CONFIG[key].label}
            </p>
            {entries.map((entry) => (
              <MatchupCard key={entry.opponent} entry={entry} tier={key} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
