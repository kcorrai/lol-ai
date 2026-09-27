import { GoldCurveAxes } from "@/domains/esports/components/GoldCurveAxes";
import { GoldCurveMarkers, MARKER_LEGEND } from "@/domains/esports/components/GoldCurveMarkers";
import {
  curveMid,
  curveSpan,
  objectiveMarkers,
  plotGoldCurve,
  stackDepth,
  type CurveBox,
  type CurvePoint,
  type ObjectiveMarker,
} from "@/domains/esports/goldCurveGeometry";
import { sampleClock } from "@/domains/esports/timeline";
import type { GameTimeline } from "@/domains/esports/types";

/**
 * The gold difference across a game, drawn from the sampled walk.
 *
 * Plain inline SVG rather than a charting library: it is one polyline over a
 * zero line, it has to render on the server so the shape of the game is in the
 * HTML a crawler sees, and the section carries no client-side chart bundle for
 * the sake of it.
 */

const WIDTH = 640;
/** Room on the left for the gold labels ("+10k" is the widest). */
const LEFT = 40;
const RIGHT = WIDTH - 8;
const PLOT_HEIGHT = 176;
/** How far each further marker in a stack sits from the one before it. */
const STACK_STEP = 16;

interface Layout {
  box: CurveBox;
  height: number;
  /** Centre of the marker nearest the chart, on each side. */
  blueRow: number;
  redRow: number;
}

/**
 * Blue's objectives above the chart, then the chart, the minutes, and red's
 * objectives below — each marker row as tall as that side's deepest stack.
 */
function layout(markers: ObjectiveMarker[]): Layout {
  const top = 26 + Math.max(0, stackDepth(markers, "blue") - 1) * STACK_STEP;
  const bottom = top + PLOT_HEIGHT;
  const height = bottom + 40 + Math.max(0, stackDepth(markers, "red") - 1) * STACK_STEP;
  return {
    box: { left: LEFT, right: RIGHT, top, bottom },
    height,
    blueRow: top - 14,
    redRow: bottom + 30,
  };
}

interface GoldCurveProps {
  timeline: GameTimeline;
  blueName: string;
  redName: string;
}

/** "12:00 — T1 +3,400", as one string. */
function pointLabel(point: CurvePoint, blueName: string, redName: string): string {
  if (point.diff === 0) return `${sampleClock(point.seconds)} — level`;
  const side = point.diff > 0 ? blueName : redName;
  return `${sampleClock(point.seconds)} — ${side} +${Math.abs(point.diff).toLocaleString("en-US")}`;
}

export function GoldCurve({
  timeline,
  blueName,
  redName,
}: GoldCurveProps): React.ReactElement | null {
  // Two points is the least that draws a line rather than a dot.
  if (timeline.samples.length < 2) return null;

  // Markers only need the horizontal extent, and their stacks decide how tall
  // the chart is, so they are placed before the curve is.
  const markers = objectiveMarkers(timeline, curveSpan(timeline), {
    left: LEFT,
    right: RIGHT,
    top: 0,
    bottom: 0,
  });
  const { box, height, blueRow, redRow } = layout(markers);
  const mid = curveMid(box);

  const { points, scale, span } = plotGoldCurve(timeline, box);
  const line = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");

  // One closed shape, filled twice through clips that cut it at the zero line —
  // the half above is blue's lead, the half below is red's.
  const area = `${box.left},${mid} ${line} ${points[points.length - 1].x.toFixed(1)},${mid}`;

  const last = points[points.length - 1];

  return (
    <figure className="gaming-card notch-sm px-3 py-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Gold difference over ${sampleClock(span)}, sampled every ${
          timeline.intervalSeconds / 60
        } minutes. It ends with ${
          last.diff === 0
            ? "the sides level"
            : `${last.diff > 0 ? blueName : redName} ahead by ${Math.abs(last.diff).toLocaleString("en-US")} gold`
        }.`}
      >
        <defs>
          <clipPath id="gold-curve-above">
            <rect x="0" y="0" width={WIDTH} height={mid} />
          </clipPath>
          <clipPath id="gold-curve-below">
            <rect x="0" y={mid} width={WIDTH} height={height - mid} />
          </clipPath>
        </defs>

        <GoldCurveAxes box={box} scale={scale} span={span} blueName={blueName} redName={redName} />

        <polygon
          points={area}
          fill="#4C8FFF"
          fillOpacity="0.22"
          clipPath="url(#gold-curve-above)"
        />
        <polygon
          points={area}
          fill="#FF5A5A"
          fillOpacity="0.22"
          clipPath="url(#gold-curve-below)"
        />

        {/* The zero line is the reading: which side of it the curve sits on. */}
        <line x1={box.left} y1={mid} x2={box.right} y2={mid} stroke="#6C817B" strokeWidth="1" />

        <polyline
          points={line}
          fill="none"
          stroke="#E9F5EE"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Keyed by position: the feed can publish two samples at the same
            second (seen at 4:08 on SR vs FlyQuest), and the list never reorders. */}
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="2.5" fill="#E9F5EE">
            {/* One string, not an interpolation split across children: the
                browser parses a <title>'s content as raw text and merges the
                nodes, so a multi-child title hydrates as a mismatch. */}
            <title>{pointLabel(point, blueName, redName)}</title>
          </circle>
        ))}

        <GoldCurveMarkers
          markers={markers}
          blueY={blueRow}
          redY={redRow}
          step={STACK_STEP}
          blueName={blueName}
          redName={redName}
        />
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[11px] text-text-muted">
        <span>
          Gold lead · <span className="text-accent-blue">{blueName}</span> above,{" "}
          <span className="text-danger">{redName}</span> below
          {markers.length > 0 ? ` · ${MARKER_LEGEND}` : ""}
        </span>
        <span>
          Sampled every {timeline.intervalSeconds / 60} min
          {timeline.truncated ? " · curve stops at the request ceiling" : ""}
        </span>
      </figcaption>
    </figure>
  );
}
