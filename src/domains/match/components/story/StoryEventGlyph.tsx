import { STORY_EVENT_STYLE } from "@/domains/match/story/storyEventStyle";
import type { StoryEventKind } from "@/domains/match";

interface StoryEventGlyphProps {
  kind: StoryEventKind;
  /** Half-width of the mark, in whatever units the surrounding <svg> is drawn in. */
  radius?: number;
  opacity?: number;
}

function points(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x},${y}`).join(" ");
}

/**
 * One event kind as a mark, drawn at the origin so a caller only has to translate it into place.
 * Must sit inside an <svg>; `StoryEventIcon` wraps it for use in ordinary layout.
 *
 * Shape, not colour, is what separates the kinds — see storyEventStyle.ts.
 */
export function StoryEventGlyph({
  kind,
  radius = 4,
  opacity = 1,
}: StoryEventGlyphProps): React.JSX.Element {
  const style = STORY_EVENT_STYLE[kind];
  const r = radius;
  const filled = { fill: style.colour };
  const hollow = { fill: "none", stroke: style.colour, strokeWidth: 1.4 };

  return (
    <g opacity={style.opacity * opacity}>
      {style.shape === "circle" && <circle r={r} {...filled} />}
      {style.shape === "ring" && (
        <>
          <circle r={r} {...filled} />
          <circle r={r + 2.5} {...hollow} />
        </>
      )}
      {style.shape === "diamond" && (
        <polygon
          points={points([
            [0, -r],
            [r, 0],
            [0, r],
            [-r, 0],
          ])}
          {...filled}
        />
      )}
      {style.shape === "square" && <rect x={-r} y={-r} width={r * 2} height={r * 2} {...filled} />}
      {style.shape === "hollowSquare" && (
        <rect x={-r} y={-r} width={r * 2} height={r * 2} {...hollow} />
      )}
      {style.shape === "triangle" && (
        <polygon
          points={points([
            [0, -r],
            [r, r],
            [-r, r],
          ])}
          {...filled}
        />
      )}
      {style.shape === "hollowTriangle" && (
        <polygon
          points={points([
            [0, -r],
            [r, r],
            [-r, r],
          ])}
          {...hollow}
        />
      )}
    </g>
  );
}

/**
 * The same mark as a standalone element, for the feed rows and the filter chips. `aria-hidden`
 * because every place it appears already names the kind in text beside it.
 */
export function StoryEventIcon({
  kind,
  size = 14,
}: {
  kind: StoryEventKind;
  size?: number;
}): React.JSX.Element {
  return (
    <svg viewBox="-7 -7 14 14" width={size} height={size} aria-hidden="true" className="shrink-0">
      <StoryEventGlyph kind={kind} radius={4} />
    </svg>
  );
}
