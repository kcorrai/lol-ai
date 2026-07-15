import type { GameLengthPoint } from "@/domains/meta";

const BUCKET_LABEL: Record<number, string> = {
  0: "< 25 min",
  25: "25-30 min",
  30: "30-35 min",
  35: "35-40 min",
  40: "40+ min",
};

// Horizontal win-rate bars per game-length bucket, baseline at 50%. Shows whether
// the champion scales into longer games or falls off.
export function GameLengthCurve({ points }: { points: GameLengthPoint[] }) {
  if (points.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <h2 className="mb-1 font-display text-lg font-bold text-text">Win Rate by Game Length</h2>
      <p className="mb-4 text-xs text-text-muted">How the champion performs as games go longer.</p>
      <div className="flex flex-col gap-2.5">
        {points.map((p) => {
          const good = p.winRate >= 50;
          // Map 44-56% onto 0-100% of the bar width for visual contrast.
          const fill = Math.max(4, Math.min(100, (p.winRate - 44) * (100 / 12)));
          return (
            <div key={p.minutes} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-text-muted">
                {BUCKET_LABEL[p.minutes] ?? `${p.minutes}+ min`}
              </span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${good ? "bg-success" : "bg-danger"}`}
                  style={{ width: `${fill}%` }}
                />
              </div>
              <span className={`w-12 shrink-0 text-right text-xs font-semibold ${good ? "text-success" : "text-danger"}`}>
                {p.winRate.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
