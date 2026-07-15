import { formatGamePatch } from "@/domains/meta";
import type { PatchTrendPoint } from "@/domains/meta";

// Win rate across the last few patches (oldest → newest), as compact bars.
export function TrendSparkline({ trend }: { trend: PatchTrendPoint[] }) {
  if (trend.length < 2) return null;
  const ordered = [...trend].reverse(); // op.gg returns newest first

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <h2 className="mb-4 font-display text-lg font-bold text-text">Win Rate Trend</h2>
      <div className="flex items-end justify-between gap-2">
        {ordered.map((p) => {
          const good = p.winRate >= 50;
          const height = Math.max(8, Math.min(64, (p.winRate - 44) * (64 / 12)));
          const label = formatGamePatch(p.version);
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <span className={`text-[11px] font-semibold ${good ? "text-success" : "text-danger"}`}>
                {p.winRate.toFixed(1)}%
              </span>
              <div
                className={`w-full max-w-[36px] rounded-t ${good ? "bg-success/70" : "bg-danger/70"}`}
                style={{ height }}
              />
              <span className="text-[10px] text-text-muted">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
