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
  // Nothing to compare if neither champion has curve data.
  if (curveA.length === 0 && curveB.length === 0) return null;

  const aMap = new Map(curveA.map((p) => [p.minutes, p.winRate]));
  const bMap = new Map(curveB.map((p) => [p.minutes, p.winRate]));
  // Walk the fixed bucket set so rows never silently disappear when the two
  // curves don't share the exact same buckets.
  const buckets = Object.keys(BUCKET_LABEL)
    .map(Number)
    .filter((m) => aMap.has(m) || bMap.has(m))
    .sort((x, y) => x - y);
  const oneSided = curveA.length === 0 || curveB.length === 0;

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <h2 className="mb-1 font-display text-lg font-bold text-text">Scaling Comparison</h2>
      <p className="mb-4 text-xs text-text-muted">
        Win rate by game length —{" "}
        <span className="font-semibold text-sky-400">{nameA}</span> vs{" "}
        <span className="font-semibold text-rose-400">{nameB}</span>.
        {oneSided && " Scaling data is only available for one champion in this lane."}
      </p>
      <div className="flex flex-col gap-3">
        {buckets.map((m) => {
          const wrA = aMap.get(m);
          const wrB = bMap.get(m);
          return (
            <div key={m} className="grid grid-cols-[70px_1fr] items-center gap-2">
              <span className="text-xs text-text-muted">{BUCKET_LABEL[m] ?? `${m}+`}</span>
              <div className="flex flex-col gap-1">
                {wrA === undefined ? (
                  <EmptyBar />
                ) : (
                  <Bar width={Math.max(4, Math.min(100, (wrA - 44) * (100 / 12)))} value={wrA} color="bg-sky-500" />
                )}
                {wrB === undefined ? (
                  <EmptyBar />
                ) : (
                  <Bar width={Math.max(4, Math.min(100, (wrB - 44) * (100 / 12)))} value={wrB} color="bg-rose-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyBar() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 flex-1 rounded-full bg-surface-2/50" />
      <span className="w-11 shrink-0 text-right text-[11px] text-text-muted/50">—</span>
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
