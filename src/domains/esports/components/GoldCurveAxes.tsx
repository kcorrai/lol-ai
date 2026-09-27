import { goldTicks, goldToY, timeToX, type CurveBox } from "@/domains/esports/goldCurveGeometry";

/** A gridline every five minutes, which is how a game is talked about. */
const GRID_SECONDS = 5 * 60;

const GRID = "#20302D";
const LABEL = "#6C817B";

/**
 * The frame the gold curve is read against: gold down the left, minutes along
 * the bottom, and which team owns which half. Drawn inside GoldCurve's SVG.
 */
export function GoldCurveAxes({
  box,
  scale,
  span,
  blueName,
  redName,
}: {
  box: CurveBox;
  scale: number;
  span: number;
  blueName: string;
  redName: string;
}): React.ReactElement {
  const minutes: number[] = [];
  for (let at = GRID_SECONDS; at < span; at += GRID_SECONDS) minutes.push(at);

  return (
    <g>
      {/* Gold marks down the left, so a lead can be read off the curve
          instead of estimated against a scale note underneath. */}
      {goldTicks(scale).map((tick) => {
        const y = goldToY(tick.gold, scale, box);
        return (
          <g key={tick.gold}>
            {tick.gold !== 0 && (
              <line
                x1={box.left}
                y1={y}
                x2={box.right}
                y2={y}
                stroke={GRID}
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            )}
            <text
              x={box.left - 6}
              y={y + 3.5}
              textAnchor="end"
              fill={LABEL}
              fontSize="10"
              fontFamily="monospace"
            >
              {tick.label}
            </text>
          </g>
        );
      })}

      {minutes.map((at) => {
        const x = timeToX(at, span, box);
        return (
          <g key={at}>
            <line x1={x} y1={box.top} x2={x} y2={box.bottom} stroke={GRID} strokeWidth="1" />
            <text
              x={x}
              y={box.bottom + 12}
              textAnchor="middle"
              fill={LABEL}
              fontSize="10"
              fontFamily="monospace"
            >
              {`${at / 60}m`}
            </text>
          </g>
        );
      })}

      {/* Which half belongs to whom, said on the chart itself. */}
      <text
        x={box.left + 6}
        y={box.top + 11}
        fill="#4C8FFF"
        fontSize="11"
        fontWeight="700"
        fontFamily="monospace"
      >
        {`${blueName} ahead`}
      </text>
      <text
        x={box.left + 6}
        y={box.bottom - 5}
        fill="#FF5A5A"
        fontSize="11"
        fontWeight="700"
        fontFamily="monospace"
      >
        {`${redName} ahead`}
      </text>
    </g>
  );
}
