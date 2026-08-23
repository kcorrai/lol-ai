import type { PreviewMatch, PreviewScoreboard } from "@/types/preview";

/** One page of a public profile's match list, past the server-rendered first page. */
export interface PublicMatchesResponse {
  matches: PreviewMatch[];
  /** Keyed by `PreviewMatch.matchId`, same shape the profile page's own scoreboards use. */
  scoreboards: Record<string, PreviewScoreboard>;
  /**
   * Offset to ask for next, or null once Riot stops handing back a full page.
   *
   * Computed here rather than derived by the caller: the page size lives on this side, and a
   * client adding up the rows it *kept* would drift backwards over any match that failed to map
   * and serve the same games twice.
   */
  nextStart: number | null;
}
