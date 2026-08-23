import type { StoryEventKind } from "@/domains/match/types/matchStory.types";

/**
 * Shape is what tells the seven kinds apart, not colour — the load-bearing decision of the LA-52
 * design (see docs/design/la-52-match-story/README.md). Three of the seven sit on red, amber and
 * acid against a dark ground, which is the range red-green colour blindness collapses, and the two
 * pairs that deliberately share a hue (structure/plate, ward placed/cleared) are separated by
 * filled versus hollow. The same glyph is drawn in the chart ticks, the map pins, the feed rows
 * and the filter chips, so a reader only ever has to learn it once.
 */
export type GlyphShape =
  | "circle"
  | "ring"
  | "diamond"
  | "square"
  | "hollowSquare"
  | "triangle"
  | "hollowTriangle";

export interface StoryEventStyle {
  shape: GlyphShape;
  /** A token from globals.css rather than a literal, so the palette stays in one place. */
  colour: string;
  label: string;
  /** Held back from full strength where a kind is deliberately quieter than its pair. */
  opacity: number;
}

export const STORY_EVENT_STYLE: Record<StoryEventKind, StoryEventStyle> = {
  CHAMPION_KILL: { shape: "circle", colour: "var(--acid-500)", label: "Kill", opacity: 1 },
  CHAMPION_SPECIAL_KILL: {
    shape: "ring",
    colour: "var(--acid-300)",
    label: "Multi-kill",
    opacity: 1,
  },
  ELITE_MONSTER_KILL: {
    shape: "diamond",
    colour: "var(--amber-500)",
    label: "Objective",
    opacity: 1,
  },
  BUILDING_KILL: { shape: "square", colour: "var(--red-500)", label: "Structure", opacity: 1 },
  // A plate is the small change of a structure kill, so it shares the hue and gives up the fill.
  TURRET_PLATE_DESTROYED: {
    shape: "hollowSquare",
    colour: "var(--red-500)",
    label: "Plate",
    opacity: 0.65,
  },
  WARD_PLACED: { shape: "triangle", colour: "var(--teal-500)", label: "Ward placed", opacity: 1 },
  WARD_KILL: {
    shape: "hollowTriangle",
    colour: "var(--teal-500)",
    label: "Ward cleared",
    opacity: 1,
  },
};

/**
 * Chip order: the kinds a reader is most likely to be hunting for first, wards last because they
 * are the ones most often turned off — a single match can hold more wards than everything else
 * put together.
 */
export const STORY_KIND_ORDER: readonly StoryEventKind[] = [
  "CHAMPION_KILL",
  "CHAMPION_SPECIAL_KILL",
  "ELITE_MONSTER_KILL",
  "BUILDING_KILL",
  "TURRET_PLATE_DESTROYED",
  "WARD_PLACED",
  "WARD_KILL",
];

/**
 * Riot's Rift coordinates run to roughly this on both axes. The exact bound is not published and
 * shifts slightly between map versions, which is why the result is clamped rather than trusted:
 * an event just outside the box lands on the edge instead of outside the picture.
 */
const RIFT_MAX = 14870;

/** Inset so a pin on the very edge is still drawn whole rather than half-clipped by the frame. */
const PIN_INSET = 2;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * A Riot Rift position in `RiftMap`'s 0-100 box. The y axis flips: Riot's origin is bottom-left
 * with y increasing north, `RiftMap`'s is top-left with y increasing down the screen.
 */
export function riftPercent(position: { x: number; y: number }): { x: number; y: number } {
  return {
    x: clamp((position.x / RIFT_MAX) * 100, PIN_INSET, 100 - PIN_INSET),
    y: clamp(100 - (position.y / RIFT_MAX) * 100, PIN_INSET, 100 - PIN_INSET),
  };
}

/**
 * How far an event has faded by a given minute. Pins and feed rows both use it, so a beat dims at
 * the same rate wherever the reader is looking. Never reaches zero — an old event stays faintly
 * on the map rather than disappearing, which is what makes the map read as an accumulation.
 */
const FADE_MINUTES = 6;
const FADE_FLOOR = 0.15;

export function fadeAt(eventMinute: number, currentMinute: number): number {
  const age = currentMinute - eventMinute;
  return clamp(1 - age / FADE_MINUTES, FADE_FLOOR, 1);
}
