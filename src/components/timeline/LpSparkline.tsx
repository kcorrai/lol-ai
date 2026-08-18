import type { LpPoint } from "@/domains/analysis/services/careerTimeline.types";

const WIDTH = 320;
const HEIGHT = 44;
const PADDING = 3;

/**
 * The whole tracked climb as one line.
 *
 * Inline SVG rather than the chart library the dashboard uses: there are no axes, no
 * tooltip and no legend here, and a sparkline that ships a charting runtime to draw
 * one polyline is paying for machinery it never turns on.
 *
 * Plotted against absolute LP, so a tier crossing is a step in the same line rather
 * than a drop back to zero.
 */
export function LpSparkline({ points }: { points: LpPoint[] }): React.ReactElement | null {
  // Two points is the minimum that can be a line. One is a dot, and a dot says nothing
  // a reader cannot get from the rank already printed beside it.
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = points.map((point, i) => {
    const x = PADDING + (i / (points.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - ((point.value - min) / span) * (HEIGHT - PADDING * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = coords[coords.length - 1].split(",");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-11 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Rank from ${points[0].label} to ${points[points.length - 1].label}`}
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="text-accent"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" className="fill-accent" />
    </svg>
  );
}
