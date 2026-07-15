import { z } from "zod";
import type { CanonicalPosition } from "@/domains/meta/types";

// Shared constants + helpers for the op.gg public feed. Unofficial endpoint, so
// every consumer caches (12h fresh) and keeps a never-expiring last-good fallback.
export const OPGG_BASE = "https://lol-api-champion.op.gg/api/global/champions";
export const USER_AGENT = "lol-ai-coach (+https://lolaicoach.gg)";
export const FRESH_TTL_DAYS = 0.5; // 12h
export const SNAPSHOT_TTL_DAYS = 365; // effectively permanent fallback
export const MIN_MATCHUP_GAMES = 200; // ignore tiny, noisy matchup samples

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

export function opggFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 43200 },
  });
}
