import { ALL_POSITIONS } from "@/domains/meta/positions";
import type { CanonicalPosition } from "@/domains/meta/types";
import type { DraftSeriesState } from "@/domains/draft";
import type { DraftCatalog, DraftChampion } from "@/domains/draft/draftCatalog.types";
import type { CounterTables } from "./advice.types";
import { lockedPicks } from "./draftAdvice";
import { assignLanes } from "./teamProfile";

export interface LiveLaneEdge {
  lane: CanonicalPosition;
  blue: DraftChampion;
  red: DraftChampion;
  /** Blue's win rate in the matchup, 0–100. */
  blueWinRate: number;
  favoured: "blue" | "red" | "even";
}

const EVEN_BAND = 2; // inside ±2 points a matchup is noise, not an edge

/**
 * Matchups that have actually formed, with who is ahead.
 *
 * Lanes are inferred (a draft never states them), so a flex pick can land in the
 * wrong row — which is why the panel labels this as the lane it *expects*, and
 * why anything inside a two-point band reads as even rather than as an edge.
 */
export function computeLaneEdges(
  state: DraftSeriesState,
  gameNumber: number,
  catalog: DraftCatalog,
  tables: CounterTables
): LiveLaneEdge[] {
  const blue = lockedPicks(state, gameNumber, "BLUE", catalog);
  const red = lockedPicks(state, gameNumber, "RED", catalog);

  const blueByLane = invert(assignLanes(blue), blue);
  const redByLane = invert(assignLanes(red), red);

  const edges: LiveLaneEdge[] = [];
  for (const lane of ALL_POSITIONS) {
    const b = blueByLane.get(lane);
    const r = redByLane.get(lane);
    if (!b || !r) continue;

    const blueWinRate = lookup(tables, b.key, r.key) ?? mirror(tables, r.key, b.key);
    if (blueWinRate === null) continue;

    edges.push({
      lane,
      blue: b,
      red: r,
      blueWinRate,
      favoured:
        blueWinRate >= 50 + EVEN_BAND ? "blue" : blueWinRate <= 50 - EVEN_BAND ? "red" : "even",
    });
  }
  return edges;
}

function invert(
  assigned: Map<string, CanonicalPosition>,
  champions: readonly DraftChampion[]
): Map<CanonicalPosition, DraftChampion> {
  const byLane = new Map<CanonicalPosition, DraftChampion>();
  for (const champion of champions) {
    const lane = assigned.get(champion.key.toLowerCase());
    if (lane) byLane.set(lane, champion);
  }
  return byLane;
}

function lookup(tables: CounterTables, subject: string, opponent: string): number | null {
  return tables[subject.toLowerCase()]?.vs[opponent.toLowerCase()] ?? null;
}

/** The same matchup read from the other champion's table. */
function mirror(tables: CounterTables, subject: string, opponent: string): number | null {
  const value = lookup(tables, subject, opponent);
  return value === null ? null : 100 - value;
}
