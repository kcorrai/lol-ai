// Type-only, so the meta barrel is erased at compile time and no import cycle can form.
import type { CanonicalPosition, DraftEvaluation, MatchupReport } from "@/domains/meta";
import type { LiveDraftTeams } from "@/domains/riot/services/liveDraft";

/** One of the ten players in a game being scouted. */
export interface LiveScoutPlayer {
  /** Null when Riot is anonymising this player — see `anonymous`. */
  puuid: string | null;
  championKey: string; // Data Dragon id, e.g. "Ahri" — "" when the champion is unknown to us
  championId: number;
  teamId: number; // 100 = blue, 200 = red
  /** Inferred, never reported by Riot — the view must say so. Null when it could not be placed. */
  position: CanonicalPosition | null;
  /** "Name#TAG", or null when Riot gave us neither a riotId nor a resolvable account. */
  riotId: string | null;
  /** Solo-queue rank, or null when unranked *or* when the lookup was skipped or failed. */
  rank: { tier: string; division: string; lp: number; wins: number; losses: number } | null;
  /**
   * Riot is hiding who this is: no puuid, and a champion name where the Riot ID would be.
   *
   * Distinct from "we failed to look them up", which also leaves `riotId` null — this one is a
   * deliberate answer from Riot and the view says so rather than looking broken.
   */
  anonymous: boolean;
  /** The player whose Riot ID was searched for. */
  isSubject: boolean;
}

export interface LiveScout {
  inGame: true;
  gameId: number;
  /** Riot's raw enum (CLASSIC, CHERRY, …); the view labels it via `gameModeLabel`. */
  gameMode: string;
  gameLength: number; // seconds since the game started
  yourSide: "blue" | "red";
  players: LiveScoutPlayer[];
  draft: LiveDraftTeams;
  /** The whole draft read. Null only when the meta snapshot is unavailable. */
  evaluation: DraftEvaluation | null;
  /** The subject's own lane, read in depth. Null when their lane is unopposed or unknown. */
  yourMatchup: MatchupReport | null;
}

export type LiveScoutResult = LiveScout | { inGame: false };
