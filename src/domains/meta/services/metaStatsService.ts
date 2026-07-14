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

const PositionSchema = z.object({
  name: z.string(),
  stats: z.object({
    play: z.number(),
    win_rate: z.number(),
    pick_rate: z.number(),
    ban_rate: z.number().nullable().optional(),
    tier_data: z.object({ tier: z.number(), rank: z.number() }).partial().optional(),
  }),
  counters: z.array(CounterSchema).optional().default([]),
});

const ChampionSchema = z.object({
  id: z.number(),
  average_stats: z.object({
    win_rate: z.number(),
    pick_rate: z.number(),
    ban_rate: z.number().nullable().optional(),
    tier: z.number().optional(),
    tier_data: z
      .object({ tier: z.number(), rank: z.number(), rank_prev_patch: z.number() })
      .partial()
      .optional(),
  }),
  // ARAM has no positions array.
  positions: z.array(PositionSchema).optional().default([]),
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

    const positions = raw.positions
      .map(mapPosition)
      .filter((p): p is PositionStats => p !== null);

    champions.push({
      championId: raw.id,
      championKey: ddragon.key,
      name: ddragon.name,
      overallWinRate: pct(raw.average_stats.win_rate),
      overallPickRate: pct(raw.average_stats.pick_rate),
      overallBanRate: pct(raw.average_stats.ban_rate ?? 0),
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
export async function getMetaSnapshot(opts: SnapshotOpts = {}): Promise<MetaSnapshot | null> {
  const resolved = { mode: opts.mode ?? "ranked", tier: opts.tier } as Required<SnapshotOpts>;
  const variant = `${resolved.mode}:${resolved.tier ?? "default"}`;
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
