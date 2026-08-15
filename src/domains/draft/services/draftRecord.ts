import type { DraftSeriesState } from "@/domains/draft/engine/draft.types";

export type { ViewerRole } from "@/domains/draft/engine/draft.types";

/**
 * Everything the server needs about a series, including the two capability
 * tokens. This shape lives in Redis and never leaves the server — routes return
 * `state` plus a resolved role, never the record itself.
 */
export interface DraftSeriesRecord {
  id: string;
  state: DraftSeriesState;
  blueToken: string;
  redToken: string;
  /** gameNumber → primary key, so a transition knows which row to update. */
  gameIds: Record<number, string>;
}
