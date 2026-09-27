import { GoldCurveAxes } from "@/domains/esports/components/GoldCurveAxes";
import {
  curveMid,
  plotGoldCurve,
  type CurveBox,
  type CurvePoint,
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
const HEIGHT = 210;
/** Room on the left for the gold labels ("+10k" is the widest), and below for minutes. */
const BOX: CurveBox = { left: 40, right: WIDTH - 8, top: 12, bottom: HEIGHT - 20 };
const MID = curveMid(BOX);

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

  const { points, scale, span } = plotGoldCurve(timeline, BOX);
  const line = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");

  // One closed shape, filled twice through clips that cut it at the zero line —
  // the half above is blue's lead, the half below is red's.
  const area = `${BOX.left},${MID} ${line} ${points[points.length - 1].x.toFixed(1)},${MID}`;

  const last = points[points.length - 1];

  return (
    <figure className="gaming-card notch-sm px-3 py-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
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
            <rect x="0" y="0" width={WIDTH} height={MID} />
          </clipPath>
          <clipPath id="gold-curve-below">
            <rect x="0" y={MID} width={WIDTH} height={HEIGHT - MID} />
          </clipPath>
        </defs>

        <GoldCurveAxes box={BOX} scale={scale} span={span} blueName={blueName} redName={redName} />

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
        <line x1={BOX.left} y1={MID} x2={BOX.right} y2={MID} stroke="#6C817B" strokeWidth="1" />

        <polyline
          points={line}
          fill="none"
          stroke="#E9F5EE"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point) => (
          <circle key={point.seconds} cx={point.x} cy={point.y} r="2.5" fill="#E9F5EE">
            {/* One string, not an interpolation split across children: the
                browser parses a <title>'s content as raw text and merges the
                nodes, so a multi-child title hydrates as a mismatch. */}
            <title>{pointLabel(point, blueName, redName)}</title>
          </circle>
        ))}
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[11px] text-text-muted">
        <span>
          Gold lead · <span className="text-accent-blue">{blueName}</span> above,{" "}
          <span className="text-danger">{redName}</span> below
        </span>
        <span>
          Sampled every {timeline.intervalSeconds / 60} min
          {timeline.truncated ? " · curve stops at the request ceiling" : ""}
        </span>
      </figcaption>
    </figure>
  );
}
