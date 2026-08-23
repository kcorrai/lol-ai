"use client";

import { useId } from "react";
import { StoryChartAxes } from "@/domains/match/components/story/StoryChartAxes";
import { StoryEventGlyph } from "@/domains/match/components/story/StoryEventGlyph";
import { useMeasuredWidth } from "@/domains/match/components/story/useMeasuredWidth";
import type { MatchStoryEvent, MatchStoryFrame } from "@/domains/match";

interface MatchStoryChartProps {
  frames: MatchStoryFrame[];
  /** Already narrowed to the kinds whose chips are on. */
  events: MatchStoryEvent[];
  minute: number;
  duration: number;
  onSeek: (minute: number) => void;
}

const MARGIN = { left: 44, right: 16, top: 28, bottom: 26 };
const FALLBACK_WIDTH = 900;
const NARROW = 520;
const TICK_ROW_Y = 14;

/**
 * The team gold difference, minute by minute, with every event of the match marked above it and a
 * playhead on the minute being read. This curve is the spine of time for the whole panel — the
 * load-bearing decision of the LA-52 design, because it is the only series that exists for every
 * minute of every match and reads as one shape without a legend.
 *
 * Hand-drawn SVG rather than recharts: the fill splits at zero into two colours from one path, the
 * event marks sit outside the plot area entirely, and the playhead is not a series. Fighting a
 * charting library into that shape costs more than the 60 lines of geometry below.
 */
export function MatchStoryChart({
  frames,
  events,
  minute,
  duration,
  onSeek,
}: MatchStoryChartProps): React.JSX.Element {
  const [wrapRef, width] = useMeasuredWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const clipId = useId();

  const height = width < NARROW ? 150 : 200;
  const plotWidth = Math.max(1, width - MARGIN.left - MARGIN.right);
  const plotHeight = Math.max(1, height - MARGIN.top - MARGIN.bottom);
  const baseY = MARGIN.top + plotHeight / 2;

  // Symmetric around zero so the reader compares the two halves by eye, not by axis label.
  const maxAbs = frames.reduce((max, f) => Math.max(max, Math.abs(f.teamGoldDiff)), 1);
  const x = (m: number): number => MARGIN.left + (m / Math.max(duration, 1)) * plotWidth;
  const y = (diff: number): number => baseY - (diff / maxAbs) * (plotHeight / 2 - 6);

  // Every fifth minute normally; every tenth once the labels would start to collide.
  const labelEvery = width < NARROW ? 10 : 5;
  const gridMinutes: number[] = [];
  for (let m = 0; m <= duration; m += labelEvery) gridMinutes.push(m);

  const curve = frames.map((f) => `${x(f.minute)},${y(f.teamGoldDiff)}`);
  const linePath = curve.length > 0 ? `M${curve.join(" L")}` : "";
  const areaPath =
    curve.length > 0
      ? `${linePath} L${x(frames[frames.length - 1].minute)},${baseY} L${x(frames[0].minute)},${baseY} Z`
      : "";

  // One mark per minute rather than per event: a 40-minute game holds hundreds of events but only
  // ever forty columns, so the row cannot crowd however busy the match was.
  const byMinute = new Map<number, MatchStoryEvent[]>();
  for (const event of events) {
    const bucket = byMinute.get(event.minute);
    if (bucket) bucket.push(event);
    else byMinute.set(event.minute, [event]);
  }

  const playheadX = x(minute);

  return (
    <div className="px-3 pt-1">
      {/* The ref sits on an unpadded child: clientWidth counts padding, and an SVG drawn that
          much too wide pushes the whole panel into a horizontal scroll at phone width. */}
      <div ref={wrapRef}>
        {/*
        Hidden from assistive tech on purpose: the curve's current value is written out as text in
        the panel's readout, and every beat marked here is a row in the feed below. Announcing the
        same match three times would make the screen harder to use, not easier.
      */}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={`${clipId}-above`}>
              <rect x={MARGIN.left} y={0} width={plotWidth} height={baseY} />
            </clipPath>
            <clipPath id={`${clipId}-below`}>
              <rect x={MARGIN.left} y={baseY} width={plotWidth} height={height - baseY} />
            </clipPath>
          </defs>

          <StoryChartAxes
            width={width}
            height={height}
            gridMinutes={gridMinutes}
            xFor={x}
            baseY={baseY}
            margin={MARGIN}
          />

          {/* One area path, filled twice and clipped to either side of zero. League fixes team 100
            to blue and 200 to red, so the sign carries the side without knowing who is watching. */}
          {areaPath && (
            <>
              <path
                d={areaPath}
                fill="var(--blue-500)"
                opacity={0.16}
                clipPath={`url(#${clipId}-above)`}
              />
              <path
                d={areaPath}
                fill="var(--red-500)"
                opacity={0.16}
                clipPath={`url(#${clipId}-below)`}
              />
              <path d={linePath} fill="none" stroke="var(--fg-1)" strokeWidth={1.5} />
            </>
          )}

          {[...byMinute.entries()].map(([m, atMinute]) => (
            <g
              key={m}
              transform={`translate(${x(m)},${TICK_ROW_Y})`}
              className="cursor-pointer"
              onClick={() => onSeek(m)}
            >
              <StoryEventGlyph kind={atMinute[0].kind} radius={4} opacity={m <= minute ? 1 : 0.3} />
              {atMinute.length > 1 && (
                <text
                  x={7}
                  y={-5}
                  fontSize={8.5}
                  fill="var(--fg-2)"
                  fontFamily="var(--font-mono, monospace)"
                >
                  ×{atMinute.length}
                </text>
              )}
            </g>
          ))}

          <line
            x1={playheadX}
            x2={playheadX}
            y1={MARGIN.top - 6}
            y2={height - MARGIN.bottom}
            stroke="var(--acid-500)"
            strokeWidth={1.5}
          />
          <polygon
            points={`${playheadX - 5},${MARGIN.top - 6} ${playheadX + 5},${MARGIN.top - 6} ${playheadX},${MARGIN.top + 2}`}
            fill="var(--acid-500)"
          />
        </svg>
      </div>
    </div>
  );
}
