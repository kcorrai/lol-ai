import type { CanonicalPosition } from "@/domains/meta/types";
import type { DraftChampion } from "@/domains/draft/draftCatalog.types";

/** One champion's win rate against every opponent, keyed by lowercase key. */
export interface CounterTable {
  lane: CanonicalPosition | null;
  /** `vs[opponent]` is the subject champion's win rate against that opponent. */
  vs: Record<string, number>;
}

/** Counter tables keyed by the subject champion's lowercase key. */
export type CounterTables = Record<string, CounterTable>;

export interface TeamProfile {
  /** 0–100, and the two always sum to 100. */
  adShare: number;
  apShare: number;
  /** 0–100 heuristics over class tags, mirroring `draftTeamEval` server-side. */
  frontlineScore: number;
  engageScore: number;
  /** Lanes with nobody in them yet, in draft order. */
  missingLanes: CanonicalPosition[];
  avgWinRate: number;
}

export interface ScoreParts {
  /** Win rate above or below 50, in points. */
  meta: number;
  /** Mean advantage into the enemy champions already locked, in points. */
  counter: number;
  /** What the pick does for the comp's damage split and frontline. */
  comp: number;
  /** How much the enemy wants it — the ban score's third term. */
  priority: number;
}

export interface AdviceEntry {
  champion: DraftChampion;
  total: number;
  parts: ScoreParts;
  /** Why it scored what it scored. Never a bare number. */
  reasons: string[];
}

export interface DraftAdvice {
  kind: "PICK" | "BAN";
  entries: AdviceEntry[];
  /** The comp as it stands, for the readout. */
  ally: TeamProfile;
  enemy: TeamProfile;
}
