"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useChampionDeepDive } from "@/hooks/useChampionDeepDive";
import type { DeathCluster } from "@/domains/analysis/types/analysis.types";

const DEATH_TIMING_LABEL: Record<DeathCluster, string> = {
  early_game: "Early-game",
  mid_game:   "Mid-game",
  late_game:  "Late-game",
  spread:     "Spread",
};
const DEATH_TIMING_COLOR: Record<DeathCluster, string> = {
  early_game: "bg-warning/15 text-warning",
  mid_game:   "bg-danger/15 text-danger",
  late_game:  "bg-purple-500/15 text-purple-400",
  spread:     "bg-border text-text-muted",
};

interface Props {
  riotAccountId: string;
  championName: string;
  onClose: () => void;
}

export function ChampionDeepDiveModal({ riotAccountId, championName, onClose }: Props) {
  const { data, isLoading } = useChampionDeepDive(riotAccountId, championName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-5 py-4">
          <div className="flex items-center gap-3">
            {data?.imageUrl && (
              <div className="h-10 w-10 overflow-hidden rounded-lg bg-surface-2">
                <Image src={data.imageUrl} alt={championName} width={40} height={40} className="object-cover" />
              </div>
            )}
            <div>
              <p className="font-display text-base font-semibold text-text">{championName}</p>
              {data && (
                <p className="text-xs text-text-muted">{data.gamesPlayed} ranked games</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:text-text transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-border" />
              ))}
            </div>
          ) : !data ? (
            <p className="text-center text-sm text-text-muted py-8">
              Not enough games on {championName} to show a deep dive.
            </p>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Win Rate", value: `${data.winRate}%`, color: data.winRate >= 55 ? "text-success" : data.winRate >= 50 ? "text-warning" : "text-danger" },
                  { label: "KDA",      value: data.avgKda.toFixed(2), color: "text-text" },
                  { label: "CS/min",   value: data.avgCsPerMinute.toFixed(1), color: "text-text" },
                  { label: "Deaths/G", value: data.avgDeathsPerGame.toFixed(1), color: data.avgDeathsPerGame > 4 ? "text-danger" : "text-text" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg bg-surface-2 p-2.5 text-center">
                    <p className={`text-lg font-bold font-display ${color}`}>{value}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Recent games sparkline */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">
                  Last {data.recentGames.length} games
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.recentGames.map((g, i) => (
                    <div
                      key={i}
                      title={`${g.kills}/${g.deaths}/${g.assists} · ${g.csPerMinute} CS/m · ${g.gameDate}`}
                      className={`h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold cursor-default ${
                        g.won ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                      }`}
                    >
                      {g.won ? "W" : "L"}
                    </div>
                  ))}
                </div>
              </div>

              {/* Death timing */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Deaths tend to happen:</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DEATH_TIMING_COLOR[data.deathTiming]}`}>
                  {DEATH_TIMING_LABEL[data.deathTiming]}
                </span>
              </div>

              {/* AI coaching summary */}
              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-accent">
                  ✦ Coaching Analysis
                </p>
                {data.coachingSummary ? (
                  <p className="text-sm leading-relaxed text-text-muted">{data.coachingSummary}</p>
                ) : (
                  <p className="text-xs text-text-muted italic">
                    Analysis not available — make sure you have at least 3 ranked games on this champion.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
