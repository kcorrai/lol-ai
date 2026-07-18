import type { CanonicalPosition, GameLengthPoint } from "@/domains/meta/types";

// A team is a mapping of lane → Data Dragon champion key. Partial so the UI can
// evaluate incomplete drafts.
export type DraftTeam = Partial<Record<CanonicalPosition, string>>;
export type DraftSide = "blue" | "red";

export interface DraftChampion {
  key: string;
  name: string;
  championId: number;
  position: CanonicalPosition;
  winRate: number; // 0-100 in this lane
  tier: number; // 1 (best) .. 5
}

export interface TeamEval {
  side: DraftSide;
  champions: DraftChampion[];
  adShare: number; // 0-100 physical damage share
  apShare: number; // 0-100 magic damage share
  frontlineScore: number; // 0-100
  engageScore: number; // 0-100
  avgWinRate: number; // 0-100
  scalingLean: "early" | "balanced" | "late";
  gameLengthCurve: GameLengthPoint[]; // aggregated team win rate by game length
}

export interface LaneEdge {
  position: CanonicalPosition;
  favored: DraftSide | "even";
  blueKey: string;
  redKey: string;
  blueWinRate: number; // blue champion's win rate in the matchup (0-100)
  note: string;
}

export interface DraftEvaluation {
  patch: string;
  blue: TeamEval;
  red: TeamEval;
  laneEdges: LaneEdge[];
  verdict: string;
}
