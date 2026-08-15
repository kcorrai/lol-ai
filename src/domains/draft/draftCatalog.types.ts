import type { CanonicalPosition } from "@/domains/meta/types";

export interface DraftChampion {
  /** Data Dragon id, e.g. "Ahri" — the key the engine stores. */
  key: string;
  name: string;
  /** Lanes this champion is actually played in on the current patch. */
  lanes: CanonicalPosition[];
  /** 0–100. Zero when the meta feed has no entry for the champion. */
  winRate: number;
  pickRate: number;
  banRate: number;
}

/**
 * Everything the room needs to know about champions, fetched once when it opens.
 * Carrying the patch numbers alongside the names is what lets the grid filter by
 * lane and the advice panel rank picks without a single per-turn request.
 */
export interface DraftCatalog {
  patch: string;
  champions: DraftChampion[];
}
