import type { CoachSearchQuery, CoachSort } from "@/domains/marketplace/types";

// Turning a URL into a search, and back again.
//
// Pure and tested, because this runs on every storefront request and on the
// canonical-URL builder — and because a filter that silently disappears when it
// is spelled slightly wrong is the kind of bug nobody reports, they just leave.

export const SORTS: readonly CoachSort[] = ["rating", "price_asc", "price_desc", "newest"];

const ROLES = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;
const KINDS = ["VOD_REVIEW", "LIVE_SESSION", "LIVE_SPECTATE"] as const;
const TIERS = [
  "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
  "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER",
] as const;

/** How many coaches one page shows. */
export const PAGE_SIZE = 24;

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(
  params: Params,
  key: string,
  allowed: readonly T[]
): T | undefined {
  const value = one(params, key)?.toUpperCase();
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/**
 * Read a query out of `searchParams`.
 *
 * Anything unrecognised is dropped rather than rejected. A storefront is a
 * public URL that people edit, share and mangle; answering a bad filter with an
 * error page would be worse for everyone than answering it with all the
 * coaches.
 */
export function parseSearchQuery(params: Params): CoachSearchQuery {
  const maxPrice = Number(one(params, "maxPrice"));
  const page = Number(one(params, "page"));

  return {
    role: oneOf(params, "role", ROLES),
    kind: oneOf(params, "kind", KINDS),
    minTier: oneOf(params, "minTier", TIERS),
    // Languages are lowercase ISO 639-1 and regions are lowercase platform ids,
    // so neither gets the uppercasing the enums above need.
    language: one(params, "lang")?.toLowerCase().slice(0, 2) || undefined,
    region: one(params, "region")?.toLowerCase().slice(0, 8) || undefined,
    maxPriceCents:
      Number.isFinite(maxPrice) && maxPrice > 0 ? Math.round(maxPrice * 100) : undefined,
    // Defaults on: a coach who cannot take you is a worse result than one who
    // can, and somebody browsing has not asked to see closed doors.
    availableOnly: one(params, "all") !== "1",
    sort: SORTS.includes(one(params, "sort") as CoachSort)
      ? (one(params, "sort") as CoachSort)
      : "rating",
    limit: PAGE_SIZE,
    cursor: Number.isFinite(page) && page > 1 ? String(Math.floor(page)) : undefined,
  };
}

/** The page number a query is on. One-based, because it is in a URL people read. */
export function pageOf(query: CoachSearchQuery): number {
  const page = Number(query.cursor ?? 1);
  return Number.isFinite(page) && page > 1 ? Math.floor(page) : 1;
}

/**
 * Build the querystring for a search.
 *
 * Only non-default values are written, so the canonical URL of an unfiltered
 * storefront is a bare `/coaches` and every filtered view has exactly one
 * spelling. Keys are emitted in a fixed order for the same reason.
 */
export function buildSearchParams(query: CoachSearchQuery): string {
  const params = new URLSearchParams();

  if (query.role) params.set("role", query.role);
  if (query.kind) params.set("kind", query.kind);
  if (query.minTier) params.set("minTier", query.minTier);
  if (query.language) params.set("lang", query.language);
  if (query.region) params.set("region", query.region);
  if (query.maxPriceCents) params.set("maxPrice", String(query.maxPriceCents / 100));
  if (query.availableOnly === false) params.set("all", "1");
  if (query.sort && query.sort !== "rating") params.set("sort", query.sort);

  const page = pageOf(query);
  if (page > 1) params.set("page", String(page));

  return params.toString();
}

/** The canonical path for a search — `/coaches` when nothing is filtered. */
export function canonicalPath(query: CoachSearchQuery): string {
  const qs = buildSearchParams(query);
  return qs ? `/coaches?${qs}` : "/coaches";
}

/** Whether anything at all has been narrowed. Drives the "clear filters" affordance. */
export function isFiltered(query: CoachSearchQuery): boolean {
  return Boolean(
    query.role ||
      query.kind ||
      query.minTier ||
      query.language ||
      query.region ||
      query.maxPriceCents ||
      query.availableOnly === false
  );
}
