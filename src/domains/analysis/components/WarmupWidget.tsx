"use client";

import { useWarmupStatus } from "@/hooks/useWarmupStatus";

interface WarmupWidgetProps {
  riotAccountId: string | null | undefined;
}

export function WarmupWidget({ riotAccountId }: WarmupWidgetProps) {
  const { data, isLoading } = useWarmupStatus(riotAccountId);

  if (isLoading) {
    return <div className="h-16 animate-pulse rounded-xl border border-border bg-surface" />;
  }

  if (!data || data.status === "no_ranked_today") return null;

  const isWarmedUp = data.status === "warmed_up";
  const statusIcon = isWarmedUp ? "✅" : "⚠️";
  const statusColor = isWarmedUp ? "text-success" : "text-warning";
  const statusLabel = isWarmedUp ? "Warmed Up" : "No Warm-up";

  const hasHistory = data.withWarmupWinRate !== null && data.withoutWarmupWinRate !== null;
  const delta = hasHistory ? data.withWarmupWinRate! - data.withoutWarmupWinRate! : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted">Warm-up</p>
        <span className={`text-sm font-semibold ${statusColor}`}>
          {statusIcon} {statusLabel}
        </span>
      </div>

      <p className="mb-3 text-xs text-text-muted">{data.message}</p>

      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        {data.firstRankedResult && (
          <span>
            First ranked:{" "}
            <span
              className={`font-semibold ${data.firstRankedResult === "win" ? "text-success" : "text-danger"}`}
            >
              {data.firstRankedResult === "win" ? "Win" : "Loss"}
            </span>
          </span>
        )}

        {hasHistory && (
          <>
            <span>
              With warm-up:{" "}
              <span className="font-semibold text-success">{data.withWarmupWinRate}%</span>
            </span>
            <span>
              Without:{" "}
              <span className="font-semibold text-danger">{data.withoutWarmupWinRate}%</span>
            </span>
            {delta !== null && Math.abs(delta) >= 5 && (
              <span className={`font-semibold ${delta > 0 ? "text-success" : "text-danger"}`}>
                {delta > 0 ? `+${delta}%` : `${delta}%`} WR difference
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
