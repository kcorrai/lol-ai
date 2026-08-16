import { goldDiff, sampleClock } from "@/domains/esports/timeline";
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
const HEIGHT = 200;
const PAD_X = 8;
const PAD_Y = 12;
const MID = HEIGHT / 2;

/** Never scale to less than this, or a level game draws a dramatic wobble. */
const MIN_SCALE_GOLD = 2000;

/** A gridline every five minutes, which is how a game is talked about. */
const GRID_SECONDS = 5 * 60;

interface Point {
  x: number;
  y: number;
  seconds: number;
  diff: number;
}

function plot(timeline: GameTimeline): { points: Point[]; scale: number; span: number } {
  const span = Math.max(...timeline.samples.map((sample) => sample.seconds), 1);
  const scale = Math.max(
    MIN_SCALE_GOLD,
    ...timeline.samples.map((sample) => Math.abs(goldDiff(sample)))
  );

  const points = timeline.samples.map((sample) => {
    const diff = goldDiff(sample);
    return {
      seconds: sample.seconds,
      diff,
      x: PAD_X + (sample.seconds / span) * (WIDTH - PAD_X * 2),
      y: MID - (diff / scale) * (MID - PAD_Y),
    };
  });

  return { points, scale, span };
}

export function GoldCurve({ timeline }: { timeline: GameTimeline }): React.ReactElement | null {
  // Two points is the least that draws a line rather than a dot.
  if (timeline.samples.length < 2) return null;

  const { points, scale, span } = plot(timeline);
  const line = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");

  // One closed shape, filled twice through clips that cut it at the zero line —
  // the half above is blue's lead, the half below is red's.
  const area = `${PAD_X},${MID} ${line} ${points[points.length - 1].x.toFixed(1)},${MID}`;

  const gridlines: number[] = [];
  for (let at = GRID_SECONDS; at < span; at += GRID_SECONDS) gridlines.push(at);

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
            : `${last.diff > 0 ? "blue" : "red"} ahead by ${Math.abs(last.diff).toLocaleString("en-US")} gold`
        }.`}
      >
        <defs>
          <clipPath id="gold-curve-above">
            <rect x="0" y="0" width={WIDTH} height={MID} />
          </clipPath>
          <clipPath id="gold-curve-below">
            <rect x="0" y={MID} width={WIDTH} height={MID} />
          </clipPath>
        </defs>

        {gridlines.map((at) => {
          const x = PAD_X + (at / span) * (WIDTH - PAD_X * 2);
          return (
            <g key={at}>
              <line x1={x} y1={PAD_Y} x2={x} y2={HEIGHT - PAD_Y} stroke="#20302D" strokeWidth="1" />
              <text x={x + 4} y={HEIGHT - 2} fill="#485954" fontSize="10" fontFamily="monospace">
                {at / 60}m
              </text>
            </g>
          );
        })}

        <polygon points={area} fill="#4C8FFF" fillOpacity="0.22" clipPath="url(#gold-curve-above)" />
        <polygon points={area} fill="#FF5A5A" fillOpacity="0.22" clipPath="url(#gold-curve-below)" />

        {/* The zero line is the reading: which side of it the curve sits on. */}
        <line x1={PAD_X} y1={MID} x2={WIDTH - PAD_X} y2={MID} stroke="#6C817B" strokeWidth="1" />

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
            <title>
              {sampleClock(point.seconds)} —{" "}
              {point.diff === 0
                ? "level"
                : `${point.diff > 0 ? "blue" : "red"} +${Math.abs(point.diff).toLocaleString("en-US")}`}
            </title>
          </circle>
        ))}
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[11px] text-text-muted">
        <span>
          <span className="text-accent-blue">Blue</span> above,{" "}
          <span className="text-danger">red</span> below · scale ±
          {(scale / 1000).toFixed(1)}k gold
        </span>
        <span>
          Sampled every {timeline.intervalSeconds / 60} min
          {timeline.truncated ? " · curve stops at the request ceiling" : ""}
        </span>
      </figcaption>
    </figure>
  );
}
