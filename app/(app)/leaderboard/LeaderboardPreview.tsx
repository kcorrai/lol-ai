"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";
import { PreviewBadge } from "@/domains/onboarding/preview/PreviewBadge";
import { cn } from "@/lib/utils";

// Illustrative leaderboard shown to a brand-new user during the guided first-journey, so the tour
// can *show* what the ranking looks like instead of parking them on an empty state (TASK-219).
// Deterministic sample data — never the user's real stats (see PreviewBadge).

interface PreviewEntry {
  rank: number;
  name: string;
  tier: string;
  tierColor: string;
  lp: number;
  wins: number;
  losses: number;
  winRate: number;
  lpGained: number;
  isYou?: boolean;
}

const MOCK_ENTRIES: PreviewEntry[] = [
  { rank: 1, name: "Faker", tier: "Challenger", tierColor: "text-warning", lp: 1240, wins: 143, losses: 71, winRate: 67, lpGained: 96 },
  { rank: 2, name: "Chovy", tier: "Grandmaster", tierColor: "text-danger", lp: 843, wins: 121, losses: 74, winRate: 62, lpGained: 74 },
  { rank: 3, name: "Caps", tier: "Master", tierColor: "text-accent", lp: 412, wins: 98, losses: 66, winRate: 60, lpGained: 61 },
  { rank: 4, name: "DevPlayer", tier: "Diamond IV", tierColor: "text-info", lp: 58, wins: 71, losses: 55, winRate: 56, lpGained: 45 },
  { rank: 5, name: "You", tier: "Gold II", tierColor: "text-warning", lp: 71, wins: 34, losses: 28, winRate: 55, lpGained: 38, isYou: true },
];

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function PreviewRow({ entry, index }: { entry: PreviewEntry; index: number }): React.JSX.Element {
  const isTop3 = entry.rank <= 3;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.12, duration: 0.35, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        entry.isYou
          ? "border-accent/50 bg-accent/10 ring-1 ring-accent/30"
          : isTop3
            ? "border-accent/20 bg-accent/5"
            : "border-border bg-surface",
      )}
    >
      <div className="flex w-8 shrink-0 items-center justify-center">
        {isTop3 ? (
          <span className="text-lg">{RANK_MEDALS[entry.rank - 1]}</span>
        ) : (
          <span className="w-7 text-center text-sm font-bold text-text-muted">{entry.rank}</span>
        )}
      </div>

      <div className="h-9 w-9 shrink-0 rounded-full border border-border bg-surface-2" />

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold", entry.isYou ? "text-accent" : "text-text")}>
          {entry.name}
          {entry.isYou && <span className="ml-1.5 text-[10px] font-medium text-accent/70">(that&apos;s you)</span>}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className={`text-xs font-medium ${entry.tierColor}`}>
            {entry.tier} · {entry.lp} LP
          </span>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-6 sm:flex">
        <div className="text-right">
          <p className="text-xs text-text-muted">Matches</p>
          <p className="text-sm font-semibold text-text">
            <span className="text-success">{entry.wins}W</span>
            <span className="text-text-muted"> {entry.losses}L</span>
          </p>
        </div>
        <div className="w-14 text-right">
          <p className="text-xs text-text-muted">WR</p>
          <p className={cn("text-sm font-bold", entry.winRate >= 55 ? "text-success" : "text-text")}>{entry.winRate}%</p>
        </div>
      </div>

      <div className="w-16 shrink-0 text-right">
        <p className="text-[10px] text-text-muted">LP</p>
        <span className="flex items-center justify-end gap-0.5 text-sm font-bold text-success">
          <TrendingUp className="h-3.5 w-3.5" />+{entry.lpGained}
        </span>
      </div>
    </motion.div>
  );
}

export function LeaderboardPreview(): React.JSX.Element {
  return (
    <div data-tour="leaderboard-preview" className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
          <Trophy className="h-4 w-4 text-accent" /> Here&apos;s how the climb looks
        </span>
        <PreviewBadge />
      </div>
      <div className="space-y-2">
        {MOCK_ENTRIES.map((entry, i) => (
          <PreviewRow key={entry.rank} entry={entry} index={i} />
        ))}
      </div>
    </div>
  );
}
