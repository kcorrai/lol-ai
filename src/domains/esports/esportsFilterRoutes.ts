import { parseProMetaRole } from "@/domains/esports/proMetaRole";
import { VOD_PAGE_SIZE } from "@/domains/esports/vodPaging";
import { FILTER_SEGMENT, toSegment, type FilterRoute } from "@/lib/routing/filterRewrite";

// Filtered esports pages, served from the page cache (ADR-061).
//
// The same move as the tool pages: the visible URL keeps its query string and middleware rewrites
// a filtered request onto an internal static copy. Measured at 50 concurrent visitors before this,
// `/esports/vods` and `/esports/champions` sat at ~2.3 s p50 while the section's static pages
// answered from cache.
//
// Every value is normalised to one spelling before it becomes a path, so two queries that mean
// the same thing share one cached page. League values cannot be checked against the feed from
// here, so they are held to a strict shape, and the internal route answers 404 to one that
// matches the shape but names no league — so a made-up league cannot mint a cached page.
//
// Imports are constant-only modules: this runs in middleware.

const MATCH = /^\/esports\/matches\/([^/]+)$/;
const INTERNAL = new RegExp(`^/esports/(champions|vods|matches/[^/]+)/${FILTER_SEGMENT}(/|$)`);

/** A game in a series. Best-of-five is the longest the pro circuit plays. */
const GAME = /^[1-5]$/;
/** A league slug as the feed writes them: `lck`, `lcs`, `worlds`, `lck_challengers_league`. */
const LEAGUE_SLUG = /^[a-z0-9][a-z0-9_-]{0,39}$/;
/** A league's display name as the VOD archive writes it: `LCK`, `LCK Challengers League`. */
const LEAGUE_NAME = /^[A-Za-z0-9][A-Za-z0-9 .'&_-]{0,59}$/;
/** Enough pages for any archive; past this a request is refused rather than cached. */
const MAX_SHOW = 2000;

function matchValue(raw: string | null, shape: RegExp): string | null {
  return raw !== null && shape.test(raw) ? raw : null;
}

/** `show` rounded up to whole pages, or null when it asks for no more than the first page. */
function vodShow(raw: string | null): string | null {
  if (raw === null || !/^\d{1,4}$/.test(raw)) return null;
  const asked = Number(raw);
  if (asked <= VOD_PAGE_SIZE || asked > MAX_SHOW) return null;
  return String(Math.ceil(asked / VOD_PAGE_SIZE) * VOD_PAGE_SIZE);
}

export function esportsFilterRoute(pathname: string, query: URLSearchParams): FilterRoute {
  if (INTERNAL.test(pathname)) return { kind: "not-found" };

  const match = MATCH.exec(pathname);
  if (match) {
    const game = matchValue(query.get("g"), GAME);
    return game
      ? { kind: "rewrite", pathname: `/esports/matches/${match[1]}/${FILTER_SEGMENT}/${game}` }
      : null;
  }

  if (pathname === "/esports/champions") {
    const league = matchValue(query.get("league"), LEAGUE_SLUG);
    // "picks" is the default order, so only the other one is a filter.
    const sort = query.get("sort") === "winRate" ? "winRate" : null;
    const role = parseProMetaRole(query.get("role") ?? undefined);
    if (!league && !sort && !role) return null;
    return {
      kind: "rewrite",
      pathname: `/esports/champions/${FILTER_SEGMENT}/${toSegment(league)}/${toSegment(sort)}/${toSegment(role)}`,
    };
  }

  if (pathname === "/esports/vods") {
    const league = matchValue(query.get("league"), LEAGUE_NAME);
    const show = vodShow(query.get("show"));
    if (!league && !show) return null;
    return {
      kind: "rewrite",
      pathname: `/esports/vods/${FILTER_SEGMENT}/${toSegment(league)}/${toSegment(show)}`,
    };
  }

  return null;
}
