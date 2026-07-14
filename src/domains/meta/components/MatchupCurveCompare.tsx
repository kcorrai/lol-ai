import type { GameLengthPoint } from "@/domains/meta";

const BUCKET_LABEL: Record<number, string> = {
  0: "< 25 min",
  25: "25-30 min",
  30: "30-35 min",
  35: "35-40 min",
  40: "40+ min",
};

// Overlays two champions' win rates by game length so readers can see who scales
// better into the matchup as the game goes on.
export function MatchupCurveCompare({
  nameA,
  nameB,
  curveA,
  curveB,
}: {
  nameA: string;
  nameB: string;
  curveA: GameLengthPoint[];
  curveB: GameLengthPoint[];
}) {
  if (curveA.length === 0 || curveB.length === 0) return null;
  const bMap = new Map(curveB.map((p) => [p.minutes, p.winRate]));

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <h2 className="mb-1 font-display text-lg font-bold text-text">Scaling Comparison</h2>
      <p className="mb-4 text-xs text-text-muted">
        Win rate by game length —{" "}
        <span className="font-semibold text-sky-400">{nameA}</span> vs{" "}
        <span className="font-semibold text-rose-400">{nameB}</span>.
      </p>
      <div className="flex flex-col gap-3">
        {curveA.map((p) => {
          const wrB = bMap.get(p.minutes);
          if (wrB === undefined) return null;
          const widthA = Math.max(4, Math.min(100, (p.winRate - 44) * (100 / 12)));
          const widthB = Math.max(4, Math.min(100, (wrB - 44) * (100 / 12)));
          return (
            <div key={p.minutes} className="grid grid-cols-[70px_1fr] items-center gap-2">
              <span className="text-xs text-text-muted">{BUCKET_LABEL[p.minutes] ?? `${p.minutes}+`}</span>
              <div className="flex flex-col gap-1">
                <Bar width={widthA} value={p.winRate} color="bg-sky-500" />
                <Bar width={widthB} value={wrB} color="bg-rose-500" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Bar({ width, value, color }: { width: number; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="w-11 shrink-0 text-right text-[11px] font-semibold text-text-muted">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}
