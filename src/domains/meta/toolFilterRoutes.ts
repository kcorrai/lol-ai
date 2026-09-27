import { parseRegion, parseTier } from "@/domains/meta/services/opggShared";
import { parsePosition, POSITION_SLUG } from "@/domains/meta/positions";
import { ANY, FILTER_SEGMENT, type FilterRoute } from "@/lib/routing/filterRewrite";

// Filtered tool pages, served from the page cache (ADR-061).
//
// The tier list and counter pages take their filters as search params — `?tier=emerald_plus` —
// and a page that reads search params is rendered per request. Measured at 50 concurrent
// visitors those two pages sat at ~3 s p50 while every cached page answered in under 20 ms.
//
// So the visible URLs stay as they are, and middleware rewrites a filtered request onto an
// internal path that carries the filters as segments: `/counters/Jhin?tier=emerald_plus` is
// served by `/counters/Jhin/f/emerald_plus/any`, which is an ordinary cacheable page. Only values
// the parsers accept are rewritten, so the set of cached pages stays bounded — a made-up value is
// ignored exactly as the page always ignored it.
//
// Imports are the two constant-only modules, never the domain index: this runs in middleware.

export type ToolFilterRoute = FilterRoute;

const TIER_LIST_ROLE = /^\/tools\/tier-list\/([^/]+)$/;
const COUNTERS = /^\/counters\/([^/]+)$/;
const INTERNAL = new RegExp(`^/(tools/tier-list|counters)/[^/]+/${FILTER_SEGMENT}(/|$)`);

export function toolFilterRoute(pathname: string, query: URLSearchParams): ToolFilterRoute {
  if (INTERNAL.test(pathname)) return { kind: "not-found" };

  // Legacy `?role=` on the hub was consolidated onto the path-based role pages; the page used to
  // do this itself, which made the hub dynamic.
  if (pathname === "/tools/tier-list") {
    const role = parsePosition(query.get("role"));
    return role ? { kind: "redirect", pathname: `/tools/tier-list/${POSITION_SLUG[role]}` } : null;
  }

  const tierList = TIER_LIST_ROLE.exec(pathname);
  if (tierList) {
    const tier = parseTier(query.get("tier"));
    const region = parseRegion(query.get("region"));
    if (!tier && !region) return null;
    return {
      kind: "rewrite",
      pathname: `/tools/tier-list/${tierList[1]}/${FILTER_SEGMENT}/${tier ?? ANY}/${region ?? ANY}`,
    };
  }

  const counters = COUNTERS.exec(pathname);
  if (counters) {
    const tier = parseTier(query.get("tier"));
    const role = parsePosition(query.get("role"));
    if (!tier && !role) return null;
    return {
      kind: "rewrite",
      pathname: `/counters/${counters[1]}/${FILTER_SEGMENT}/${tier ?? ANY}/${role ?? ANY}`,
    };
  }

  return null;
}
