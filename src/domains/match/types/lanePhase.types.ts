import type { TimelineEventKind } from "@prisma/client";

/** One minute of the lane, as a difference. Positive means the player is ahead. */
export interface LanePhasePoint {
  minute: number;
  goldDiff: number;
  xpDiff: number;
  csDiff: number;
}

/** Something that happened, placed on the same minute axis as the curve. */
export interface LanePhaseMarker {
  minute: number;
  kind: TimelineEventKind;
  /** Which side it went for, read from the player's point of view. */
  side: "player" | "opponent";
  label: string;
}

export interface LanePhaseOpponent {
  puuid: string;
  championName: string;
  gameName: string | null;
  tagLine: string | null;
}

export interface LanePhase {
  position: string;
  championName: string;
  opponent: LanePhaseOpponent | null;
  points: LanePhasePoint[];
  markers: LanePhaseMarker[];
}
