import type { GameLengthPoint } from "@/domains/meta/types";

export interface ScalingSeries {
  label: string;
  points: GameLengthPoint[];
  /** Tailwind colour token shared by the line (`stroke-*`), dots (`fill-*`) and legend (`bg-*`). */
  tone: "info" | "danger" | "accent";
}

const TONE = {
  info: { stroke: "stroke-info", fill: "fill-info", text: "fill-info", swatch: "bg-info" },
  danger: {
    stroke: "stroke-danger",
    fill: "fill-danger",
    text: "fill-danger",
    swatch: "bg-danger",
  },
  accent: {
    stroke: "stroke-accent",
    fill: "fill-accent",
    text: "fill-accent",
    swatch: "bg-accent",
  },
} as const;

const BUCKETS = [0, 25, 30, 35, 40];
const BUCKET_LABEL: Record<number, string> = {
  0: "<25m",
  25: "25–30",
  30: "30–35",
  35: "35–40",
  40: "40m+",
};

// Fixed pixel height, percentage x: the svg has no viewBox, so its text stays at its set size on a
// phone and on a wide desktop instead of scaling with the chart's width.
const H = 190;
const PAD = { top: 22, bottom: 28 };
const X_INSET = 5; // % of width kept clear at each side for the end labels

/**
 * Win rate by game length for up to two sides, as lines over a 50% baseline.
 *
 * Two lines on one set of axes answer "who scales better" at a glance, where two stacked bar
 * lists made the reader compare lengths across rows. The y range comes from the data (padded, and
 * always including 50%) because these curves live within a few points of each other.
 */
export function ScalingChart({ series }: { series: ScalingSeries[] }): React.ReactElement | null {
  const drawn = series.filter((s) => s.points.length > 0);
  if (drawn.length === 0) return null;

  const values = drawn.flatMap((s) => s.points.map((p) => p.winRate));
  const lo = Math.floor(Math.min(50, ...values) - 1);
  const hi = Math.ceil(Math.max(50, ...values) + 1);
  const x = (minutes: number): string => {
    const i = BUCKETS.indexOf(minutes);
    const at = i === -1 ? BUCKETS.length - 1 : i;
    return `${X_INSET + (at / (BUCKETS.length - 1)) * (100 - 2 * X_INSET)}%`;
  };
  const y = (winRate: number): number =>
    PAD.top + ((hi - winRate) / (hi - lo)) * (H - PAD.top - PAD.bottom);

  // Labels sit above the upper line and below the lower one so two close values never collide.
  const upperAt = (minutes: number, index: number): boolean => {
    if (drawn.length < 2) return true;
    const mine = drawn[index].points.find((p) => p.minutes === minutes)?.winRate ?? 0;
    const other = drawn[1 - index].points.find((p) => p.minutes === minutes)?.winRate;
    return other === undefined || mine >= other;
  };

  return (
    <figure>
      <figcaption className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        {drawn.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-text-body">
            <span className={`h-0.5 w-4 ${TONE[s.tone].swatch}`} aria-hidden />
            {s.label}
          </span>
        ))}
      </figcaption>
      <svg
        width="100%"
        height={H}
        className="overflow-visible"
        role="img"
        aria-label={drawn
          .map(
            (s) =>
              `${s.label}: ${s.points.map((p) => `${BUCKET_LABEL[p.minutes] ?? p.minutes} ${p.winRate.toFixed(1)}%`).join(", ")}`
          )
          .join("; ")}
      >
        {BUCKETS.map((m) => (
          <g key={m}>
            <line
              x1={x(m)}
              x2={x(m)}
              y1={PAD.top - 8}
              y2={H - PAD.bottom}
              className="stroke-line-1"
              strokeWidth={1}
            />
            <text
              x={x(m)}
              y={H - 8}
              textAnchor="middle"
              className="fill-text-muted font-mono text-[10px]"
            >
              {BUCKET_LABEL[m]}
            </text>
          </g>
        ))}
        <line
          x1="0"
          x2="100%"
          y1={y(50)}
          y2={y(50)}
          className="stroke-line-3"
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <text
          x="100%"
          y={y(50) - 5}
          textAnchor="end"
          className="fill-text-muted font-mono text-[9px]"
        >
          50%
        </text>

        {drawn.map((s, si) => {
          const pts = [...s.points].sort((a, b) => a.minutes - b.minutes);
          // Segments rather than one path: a path's d cannot take percentages.
          return (
            <g key={s.label}>
              {pts.slice(1).map((p, i) => (
                <line
                  key={p.minutes}
                  x1={x(pts[i].minutes)}
                  y1={y(pts[i].winRate)}
                  x2={x(p.minutes)}
                  y2={y(p.winRate)}
                  className={TONE[s.tone].stroke}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              ))}
              {pts.map((p) => {
                const above = upperAt(p.minutes, si);
                return (
                  <g key={p.minutes}>
                    <circle
                      cx={x(p.minutes)}
                      cy={y(p.winRate)}
                      r={3.5}
                      className={TONE[s.tone].fill}
                    />
                    <text
                      x={x(p.minutes)}
                      y={y(p.winRate) + (above ? -9 : 17)}
                      textAnchor="middle"
                      className={`${TONE[s.tone].text} font-mono text-[10.5px] font-bold`}
                    >
                      {p.winRate.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
