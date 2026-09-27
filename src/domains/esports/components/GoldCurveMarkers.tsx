import type { ObjectiveMarker } from "@/domains/esports/goldCurveGeometry";
import { sampleClock, type ObjectiveKind } from "@/domains/esports/timeline";

const LETTER: Record<ObjectiveKind, string> = {
  tower: "T",
  inhibitor: "I",
  dragon: "D",
  baron: "B",
};

const NAME: Record<ObjectiveKind, { one: string; many: string }> = {
  tower: { one: "tower", many: "towers" },
  inhibitor: { one: "inhibitor", many: "inhibitors" },
  dragon: { one: "dragon", many: "dragons" },
  baron: { one: "baron", many: "barons" },
};

const COLOUR = { blue: "#4C8FFF", red: "#FF5A5A" } as const;

const BADGE_WIDTH = 17;
const BADGE_HEIGHT = 14;

/** Which objective each letter stands for, for the caption under the chart. */
export const MARKER_LEGEND = "T tower · I inhibitor · D dragon · B baron";

/**
 * Objectives as badges on the gold curve, blue's along the top and red's along
 * the bottom, so a lead can be read next to what bought it.
 *
 * The title says "by", as the ledger under the chart does: the walk samples the
 * game every few minutes and only knows which window an objective fell in.
 */
export function GoldCurveMarkers({
  markers,
  blueY,
  redY,
  blueName,
  redName,
}: {
  markers: ObjectiveMarker[];
  /** Vertical centre of each side's row. */
  blueY: number;
  redY: number;
  blueName: string;
  redName: string;
}): React.ReactElement {
  return (
    <g>
      {markers.map((marker) => {
        const y = marker.side === "blue" ? blueY : redY;
        const colour = COLOUR[marker.side];
        const team = marker.side === "blue" ? blueName : redName;
        const noun = marker.count === 1 ? NAME[marker.kind].one : NAME[marker.kind].many;
        const title = `By ${sampleClock(marker.seconds)} — ${team} took ${marker.count} ${noun}`;

        return (
          <g key={marker.key}>
            <title>{title}</title>
            <rect
              x={marker.x - BADGE_WIDTH / 2}
              y={y - BADGE_HEIGHT / 2}
              width={BADGE_WIDTH}
              height={BADGE_HEIGHT}
              rx="2"
              fill={colour}
              fillOpacity="0.18"
              stroke={colour}
              strokeWidth="1"
            />
            <text
              x={marker.x}
              y={y + 3.5}
              textAnchor="middle"
              fill={colour}
              fontSize={marker.count > 1 ? "9" : "10"}
              fontWeight="700"
              fontFamily="monospace"
            >
              {`${marker.count > 1 ? marker.count : ""}${LETTER[marker.kind]}`}
            </text>
          </g>
        );
      })}
    </g>
  );
}
