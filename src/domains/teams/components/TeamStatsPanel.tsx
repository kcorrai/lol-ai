"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
// Same reasoning as the dashboard's momentum chart: recharts is heavy, this panel is one tab of a
// team page, and the component is client-only. The fallback matches the panel's own loading height
// so switching to this tab does not jump.
const TeamWinRateTrend = dynamic(
  () => import("@/domains/teams/components/TeamWinRateTrend").then((m) => m.TeamWinRateTrend),
  {
    ssr: false,
    loading: () => <div className="h-40 animate-pulse rounded-xl bg-border/40" />,
  }
);
import { useTeamStats } from "@/hooks/useTeamStats";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
] as const;

interface TeamStatsPanelProps {
  teamId: string;
}

export function TeamStatsPanel({ teamId }: TeamStatsPanelProps) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const { data, isLoading, error } = useTeamStats(teamId, range);

  return (
    <div className="space-y-4">
      {/* Range selector */}
      <div className="flex items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              range === r.value
                ? "bg-info/20 text-info"
                : "text-text-muted hover:bg-white/5 hover:text-text"
            )}
          >
            {r.label}
          </button>
        ))}
        {data && (
          <span className="ml-auto text-xs text-text-muted">
            {data.totalGames} matches · Avg. {data.avgWinRate ?? "—"}%
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted/60">
          Team Win Rate Trend
        </p>
        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        )}
        {error && (
          <p className="flex h-40 items-center justify-center text-sm text-danger">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
        )}
        {data && <TeamWinRateTrend data={data.teamWinRateTrend} />}
      </div>

      {/* Member sparklines */}
      {data && data.memberTrends.filter((m) => m.points.length > 0).length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.memberTrends
            .filter((m) => m.points.length > 0)
            .map((member) => {
              const last = member.points.at(-1);
              return (
                <div
                  key={member.gameName}
                  className="rounded-xl border border-border bg-surface p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-text">{member.gameName}</p>
                    {last && (
                      <span
                        className={cn(
                          "text-xs font-bold",
                          last.winRate >= 55
                            ? "text-success"
                            : last.winRate < 45
                              ? "text-danger"
                              : "text-text-muted"
                        )}
                      >
                        {last.winRate}%
                      </span>
                    )}
                  </div>
                  <TeamWinRateTrend data={member.points} />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
