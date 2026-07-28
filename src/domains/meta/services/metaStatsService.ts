import { unstable_cache } from "next/cache";
import { z } from "zod";
import { getCached, setCached } from "@/lib/ai/aiCache";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { getLatestDdragonVersion } from "@/lib/ddragon";
import { logger } from "@/lib/utils/logger";
import {
  OPGG_BASE,
  FRESH_TTL_DAYS,
  SNAPSHOT_TTL_DAYS,
  MIN_MATCHUP_GAMES,
  OPGG_POSITION_TO_CANONICAL,
  CounterSchema,
  opggFetch,
  pct,
  type SnapshotMode,
  type SnapshotTier,
} from "@/domains/meta/services/opggShared";
import type {
  ChampionMetaStats,
  MatchupEntry,
  MetaSnapshot,
  PositionStats,
} from "@/domains/meta/types";

const CACHE_TYPE = "meta-snapshot";

const nullableNum = z.number().nullable().optional();
const TierDataSchema = z
  .object({ tier: nullableNum, rank: nullableNum, rank_prev_patch: nullableNum })
  .optional();

const PositionSchema = z.object({
  name: z.string(),
  stats: z.object({
    play: z.number(),
    win_rate: z.number(),
    pick_rate: z.number(),
    ban_rate: nullableNum,
    tier_data: TierDataSchema,
  }),
  counters: z.array(CounterSchema).optional().default([]),
});

const ChampionSchema = z.object({
  id: z.number(),
  average_stats: z.object({
    play: nullableNum,
    win_rate: z.number(),
    pick_rate: z.number(),
    ban_rate: nullableNum,
    tier: nullableNum,
    tier_data: TierDataSchema,
  }),
  // ARAM omits positions entirely (null); ranked sends an array.
  positions: z
    .array(PositionSchema)
    .nullish()
    .transform((v) => v ?? []),
});

const OpggResponseSchema = z.object({
  data: z.array(ChampionSchema),
  meta: z.object({ version: z.string().optional(), match_count: z.number().optional() }).optional(),
});

type OpggChampion = z.infer<typeof ChampionSchema>;

function mapPosition(raw: OpggChampion["positions"][number]): PositionStats | null {
  const position = OPGG_POSITION_TO_CANONICAL[raw.name];
  if (!position) return null;

  const counters: MatchupEntry[] = raw.counters
    .filter((c) => c.play >= MIN_MATCHUP_GAMES)
    .map((c) => ({
      opponentId: c.champion_id,
      games: c.play,
      subjectWins: c.win,
      subjectWinRate: pct(c.win / c.play),
    }))
    .sort((a, b) => a.subjectWinRate - b.subjectWinRate);

  return {
    position,
    games: raw.stats.play,
    winRate: pct(raw.stats.win_rate),
    pickRate: pct(raw.stats.pick_rate),
    banRate: pct(raw.stats.ban_rate ?? 0),
    tier: raw.stats.tier_data?.tier ?? 0,
    rank: raw.stats.tier_data?.rank ?? 0,
    prevPatchRank: raw.stats.tier_data?.rank_prev_patch ?? 0,
    counters,
  };
}

function buildSnapshot(
  parsed: z.infer<typeof OpggResponseSchema>,
  championIndex: Map<number, { key: string; name: string }>,
  fallbackPatch: string
): MetaSnapshot {
  const champions: ChampionMetaStats[] = [];

  for (const raw of parsed.data) {
    const ddragon = championIndex.get(raw.id);
    if (!ddragon) continue; // unknown/new champion not yet in Data Dragon

    const positions = raw.positions.map(mapPosition).filter((p): p is PositionStats => p !== null);

    champions.push({
      championId: raw.id,
      championKey: ddragon.key,
      name: ddragon.name,
      overallWinRate: pct(raw.average_stats.win_rate),
      overallPickRate: pct(raw.average_stats.pick_rate),
      overallBanRate: pct(raw.average_stats.ban_rate ?? 0),
      overallGames: raw.average_stats.play ?? 0,
      overallTier: raw.average_stats.tier ?? 0,
      overallRank: raw.average_stats.tier_data?.rank ?? 0,
      prevPatchRank: raw.average_stats.tier_data?.rank_prev_patch ?? 0,
      positions,
    });
  }

  return {
    patch: parsed.meta?.version ?? fallbackPatch,
    fetchedAt: new Date().toISOString(),
    matchCount: parsed.meta?.match_count,
    champions,
  };
}

interface SnapshotOpts {
  mode?: SnapshotMode;
  tier?: SnapshotTier;
}

async function fetchAndBuildSnapshot(opts: Required<SnapshotOpts>): Promise<MetaSnapshot> {
  const params = opts.tier ? `?tier=${opts.tier}` : "";
  const [res, champions, version] = await Promise.all([
    opggFetch(`${OPGG_BASE}/${opts.mode}${params}`),
    fetchAllChampions(),
    getLatestDdragonVersion(),
  ]);

  if (!res.ok) throw new Error(`op.gg responded ${res.status}`);

  const parsed = OpggResponseSchema.parse(await res.json());

  const championIndex = new Map<number, { key: string; name: string }>();
  for (const c of champions) {
    const numericKey = Number(c.key);
    if (!Number.isNaN(numericKey)) {
      championIndex.set(numericKey, { key: c.id, name: c.name });
    }
  }

  const patch = version.split(".").slice(0, 2).join("."); // "16.13.1" -> "16.13"
  return buildSnapshot(parsed, championIndex, patch);
}

// Returns the meta snapshot for a mode/rank bracket, or the last-good fallback, or
// null if the feed is down and nothing was ever cached. Defaults to ranked at
// op.gg's default bracket (emerald+).
// Process-level memo in front of the aiCache row (TASK-282).
//
// The snapshot is a single ~200KB blob and getMetaSnapshot had no memoization at
// all: every call was a full-blob read from Neon. A single page render calls it
// more than once (getPopularChampions calls it again for the related-links row),
// and ~739 statically generated pages revalidate on a 12h ISR cycle — so the
// same blob was crossing the network tens of thousands of times a month. That is
// what exhausted the 5GB transfer allowance.
//
// A warm serverless instance now serves repeat calls from memory. The TTL is far
// shorter than the 12h DB cache, so data freshness is unchanged in practice —
// this only collapses the burst of identical reads that one revalidation wave
// produces. Each instance holds at most a handful of variants.
const MEMO_TTL_MS = 5 * 60 * 1000;

const snapshotMemo = new Map<string, { value: MetaSnapshot | null; expiresAt: number }>();

// The memo above only helps an instance that is already warm, and a revalidation
// wave across 739 pages lands on instances that are each cold with respect to it
// — every one of them pays the full 107.8KB read again. This second level is the
// Next.js Data Cache: shared between instances and persisted, so the blob crosses
// the Neon wire once per window rather than once per instance (TASK-292, ADR-013).
//
// An hour cannot serve anything staler than the row already is: FRESH_TTL_DAYS is
// 0.5, so the underlying aiCache row is only replaced every twelve hours.
const SHARED_TTL_SECONDS = 60 * 60;

// unstable_cache stores whatever the callback resolves with, null included, but
// it does not store rejections. A null means the feed was down AND no last-good
// row existed; persisting that across every instance for an hour would keep
// serving empty pages long after the feed recovered — the opposite of what
// rememberFor() is careful to avoid. Throwing keeps it out of the shared cache
// while still being a valid result to the caller, which converts it back below.
// The sentinel never leaves this module.
class NoSnapshotAvailable extends Error {}

const loadSnapshotShared = unstable_cache(
  async (
    mode: SnapshotMode,
    tier: SnapshotTier | undefined,
    variant: string
  ): Promise<MetaSnapshot> => {
    const snapshot = await loadSnapshot({ mode, tier } as Required<SnapshotOpts>, variant);
    if (!snapshot) throw new NoSnapshotAvailable();
    return snapshot;
  },
  ["meta-snapshot"],
  { revalidate: SHARED_TTL_SECONDS, tags: [CACHE_TYPE] }
);

export async function getMetaSnapshot(opts: SnapshotOpts = {}): Promise<MetaSnapshot | null> {
  const resolved = { mode: opts.mode ?? "ranked", tier: opts.tier } as Required<SnapshotOpts>;
  const variant = `${resolved.mode}:${resolved.tier ?? "default"}`;

  const memoized = snapshotMemo.get(variant);
  if (memoized && memoized.expiresAt > Date.now()) return memoized.value;

  let snapshot: MetaSnapshot | null;
  try {
    snapshot = await loadSnapshotShared(resolved.mode, resolved.tier, variant);
  } catch (err) {
    if (!(err instanceof NoSnapshotAvailable)) throw err;
    snapshot = null;
  }

  // A null result is memoized too, but only briefly — see rememberFor below.
  snapshotMemo.set(variant, {
    value: snapshot,
    expiresAt: Date.now() + rememberFor(snapshot),
  });

  return snapshot;
}

// A successful snapshot is held for the full window. A null one means the feed
// was down AND no last-good row existed; caching that for five minutes would
// keep serving empty pages long after the feed recovered, so it is held for a
// fraction of the time — long enough to absorb a revalidation burst, short
// enough to recover quickly.
function rememberFor(snapshot: MetaSnapshot | null): number {
  return snapshot ? MEMO_TTL_MS : 30_000;
}

async function loadSnapshot(
  resolved: Required<SnapshotOpts>,
  variant: string
): Promise<MetaSnapshot | null> {
  const freshKey = `meta:snapshot:${variant}:fresh`;
  const lastGoodKey = `meta:snapshot:${variant}:last-good`;

  const fresh = (await getCached(freshKey).catch(() => null)) as MetaSnapshot | null;
  if (fresh) return fresh;

  try {
    const snapshot = await fetchAndBuildSnapshot(resolved);
    await setCached(freshKey, CACHE_TYPE, snapshot, FRESH_TTL_DAYS);
    await setCached(lastGoodKey, CACHE_TYPE, snapshot, SNAPSHOT_TTL_DAYS);
    return snapshot;
  } catch (err) {
    logger.warn(`[metaStatsService] snapshot fetch failed (${variant}), using last-good`, err);
    const lastGood = (await getCached(lastGoodKey).catch(() => null)) as MetaSnapshot | null;
    return lastGood ?? null;
  }
}

// Test seam — the memo is process-global, so suites that assert on fetch counts
// need a way to start clean without reaching into module internals.
export function __clearSnapshotMemo(): void {
  snapshotMemo.clear();
}

// Most-picked champions this patch, for related-links rows. Optionally excludes
// one champion key (the current page's champion).
export async function getPopularChampions(
  limit = 8,
  excludeKey?: string
): Promise<{ key: string; name: string }[]> {
  const snapshot = await getMetaSnapshot();
  if (!snapshot) return [];
  const needle = excludeKey?.toLowerCase();
  return [...snapshot.champions]
    .filter((c) => c.championKey.toLowerCase() !== needle)
    .sort((a, b) => b.overallPickRate - a.overallPickRate)
    .slice(0, limit)
    .map((c) => ({ key: c.championKey, name: c.name }));
}

// Looks up one champion in a snapshot by Data Dragon key (case-insensitive) or
// numeric Riot key.
export function findChampionStats(
  snapshot: MetaSnapshot,
  championKeyOrId: string | number
): ChampionMetaStats | null {
  if (typeof championKeyOrId === "number") {
    return snapshot.champions.find((c) => c.championId === championKeyOrId) ?? null;
  }
  const needle = championKeyOrId.toLowerCase();
  return (
    snapshot.champions.find(
      (c) => c.championKey.toLowerCase() === needle || c.name.toLowerCase() === needle
    ) ?? null
  );
}
