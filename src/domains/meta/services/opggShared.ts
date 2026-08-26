import { z } from "zod";
import type { CanonicalPosition } from "@/domains/meta/types";

// Shared constants + helpers for the op.gg public feed. Unofficial endpoint, so
// every consumer caches (12h fresh) and keeps a never-expiring last-good fallback.
export const OPGG_BASE = "https://lol-api-champion.op.gg/api/global/champions";

/**
 * Our platform ids → op.gg's region segment.
 *
 * The feed keys regions by its own slugs in the path: `/api/euw/champions/...` really does return
 * different numbers from `/api/global/...` — Ahri mid reads 14,355 games globally against 2,919 on
 * EUW and 3,320 on KR, ranked 7th, 5th and 12th. It is an allowlist rather than a transform
 * because the slugs do not follow a rule (`eun1` → `eune`, `la1` → `lan`, `oc1` → `oce`, and `oc`
 * answers 422), and because a reader-supplied region must never be able to name an arbitrary path
 * segment (LA-71).
 */
const OPGG_REGIONS: Record<string, string> = {
  tr1: "tr",
  euw1: "euw",
  eun1: "eune",
  na1: "na",
  kr: "kr",
  br1: "br",
  la1: "lan",
  la2: "las",
  oc1: "oce",
  ru: "ru",
  jp1: "jp",
};

/** Every platform the region filter offers, in the order the picker shows them. */
export const SNAPSHOT_REGIONS = Object.keys(OPGG_REGIONS);

/**
 * Validates a raw `?region=` value, returning the platform id or null if unrecognised.
 *
 * Null means "global", which is the default everywhere and the only variant the vast majority of
 * traffic ever creates.
 */
export function parseRegion(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  return lower in OPGG_REGIONS ? lower : null;
}

/**
 * The feed's base URL for a platform, or the global one when no region is asked for.
 *
 * Every variant is a separate cache entry and a separate op.gg fetch, so the default staying
 * global is what keeps the cost of this feature proportional to the people who use it.
 */
export function opggBase(region?: string | null): string {
  const slug = region ? OPGG_REGIONS[region] : undefined;
  return slug ? `https://lol-api-champion.op.gg/api/${slug}/champions` : OPGG_BASE;
}
export const USER_AGENT = "lol-ai-coach (+https://lolaicoach.gg)";
export const FRESH_TTL_DAYS = 0.5; // 12h
export const SNAPSHOT_TTL_DAYS = 365; // effectively permanent fallback
export const MIN_MATCHUP_GAMES = 200; // ignore tiny, noisy matchup samples
// An unofficial endpoint with no SLA: a hung connection must not hold the request open.
const OPGG_TIMEOUT_MS = 8000;

export type SnapshotMode = "ranked" | "aram";
// op.gg rank brackets, low → high. Default (no param) == emerald_plus.
export const SNAPSHOT_TIERS = [
  "all",
  "gold_plus",
  "platinum_plus",
  "emerald_plus",
  "diamond_plus",
  "master_plus",
  "challenger",
] as const;
export type SnapshotTier = (typeof SNAPSHOT_TIERS)[number];

// Human labels for each rank bracket (for filter UI).
export const TIER_LABELS: Record<SnapshotTier, string> = {
  all: "All ranks",
  gold_plus: "Gold+",
  platinum_plus: "Platinum+",
  emerald_plus: "Emerald+",
  diamond_plus: "Diamond+",
  master_plus: "Master+",
  challenger: "Challenger",
};

// Validates a raw ?tier= value, returning the bracket or null if unrecognised.
export function parseTier(raw: string | null | undefined): SnapshotTier | null {
  if (!raw) return null;
  return (SNAPSHOT_TIERS as readonly string[]).includes(raw) ? (raw as SnapshotTier) : null;
}

// Canonical → op.gg position path segment (for the per-champion detail endpoint).
export const CANONICAL_TO_OPGG: Record<CanonicalPosition, string> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MID",
  BOTTOM: "ADC",
  UTILITY: "SUPPORT",
};

export const OPGG_POSITION_TO_CANONICAL: Record<string, CanonicalPosition> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MID: "MIDDLE",
  ADC: "BOTTOM",
  SUPPORT: "UTILITY",
};

// Fraction (0-1) → percentage rounded to one decimal.
export const pct = (fraction: number): number => Math.round(fraction * 1000) / 10;

export const CounterSchema = z.object({
  champion_id: z.number(),
  play: z.number(),
  win: z.number(),
});

/**
 * Deliberately not cached by the framework. `next: { revalidate }` made Next refresh a
 * stale entry after the render, and a refresh that rejects destroys the response being
 * piped — an unreachable op.gg 500'd the page instead of falling through to the cache
 * (LA-13). Nothing is lost: both callers already sit on the Redis/Postgres fresh +
 * last-good pair above this, which is where the caching that matters happens.
 *
 * `no-cache` rather than `no-store` says the same thing to the framework — patch-fetch
 * gives both `revalidate: 0`, so neither is ever stored — while not throwing a
 * DynamicServerError inside a prerender, which is what turned every meta read during
 * `next build` into a Postgres read. ADR-045.
 */
export function opggFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    cache: "no-cache",
    signal: AbortSignal.timeout(OPGG_TIMEOUT_MS),
  });
}
