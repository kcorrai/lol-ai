interface StoryChartAxesProps {
  width: number;
  height: number;
  /** Minutes that get a gridline and a label — every fifth, or every tenth once narrow. */
  gridMinutes: number[];
  xFor: (minute: number) => number;
  baseY: number;
  margin: { left: number; right: number; top: number; bottom: number };
}

const MONO = "var(--font-mono, monospace)";

/**
 * The frame the gold curve is read against: minute gridlines, and the zero line that is the whole
 * point of the chart. Above it blue is up, below it red is — League fixes team 100 to blue and 200
 * to red in every match, so the two sides can be named outright rather than worked out per viewer.
 */
export function StoryChartAxes({
  width,
  height,
  gridMinutes,
  xFor,
  baseY,
  margin,
}: StoryChartAxesProps): React.JSX.Element {
  return (
    <>
      {gridMinutes.map((m) => (
        <g key={m}>
          <line
            x1={xFor(m)}
            x2={xFor(m)}
            y1={margin.top}
            y2={height - margin.bottom}
            stroke="rgba(255,255,255,0.05)"
          />
          <text
            x={xFor(m)}
            y={height - 8}
            fontSize={9}
            fill="var(--fg-4)"
            textAnchor="middle"
            fontFamily={MONO}
          >
            {m}m
          </text>
        </g>
      ))}

      <line
        x1={margin.left}
        x2={width - margin.right}
        y1={baseY}
        y2={baseY}
        stroke="var(--line-3)"
        strokeDasharray="3 3"
      />
      <text
        x={width - margin.right}
        y={margin.top + 10}
        fontSize={9}
        fill="var(--blue-500)"
        textAnchor="end"
        fontFamily={MONO}
      >
        BLUE AHEAD
      </text>
      <text
        x={width - margin.right}
        y={height - margin.bottom - 4}
        fontSize={9}
        fill="var(--red-500)"
        textAnchor="end"
        fontFamily={MONO}
      >
        RED AHEAD
      </text>
    </>
  );
}
