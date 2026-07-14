import { z } from "zod";
import { getCached, setCached } from "@/lib/ai/aiCache";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { getLatestDdragonVersion } from "@/lib/ddragon";
import { logger } from "@/lib/utils/logger";
import type {
  CanonicalPosition,
  ChampionMetaStats,
  MatchupEntry,
  MetaSnapshot,
  PositionStats,
} from "@/domains/meta/types";

// OP.GG's public ranked stats feed. Unofficial, so every consumer degrades
// gracefully: a fresh copy is cached 12h, and a never-expiring "last good"
// snapshot is kept as a fallback if the feed ever breaks.
const OPGG_BASE = "https://lol-api-champion.op.gg/api/global/champions";
const OPGG_URL = `${OPGG_BASE}/ranked`;

// Canonical → OP.GG position path segment for the per-champion counters endpoint.
const CANONICAL_TO_OPGG: Record<CanonicalPosition, string> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MID",
  BOTTOM: "ADC",
  UTILITY: "SUPPORT",
};
const USER_AGENT = "lol-ai-coach (+https://lolaicoach.gg)";
const CACHE_TYPE = "meta-snapshot";
const FRESH_KEY = "meta:snapshot:fresh";
const LAST_GOOD_KEY = "meta:snapshot:last-good";
const FRESH_TTL_DAYS = 0.5; // 12h
const SNAPSHOT_TTL_DAYS = 365; // effectively permanent fallback
const MIN_MATCHUP_GAMES = 200; // ignore tiny, noisy matchup samples

const OPGG_POSITION_TO_CANONICAL: Record<string, CanonicalPosition> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MID: "MIDDLE",
  ADC: "BOTTOM",
  SUPPORT: "UTILITY",
};

const CounterSchema = z.object({
  champion_id: z.number(),
  play: z.number(),
  win: z.number(),
});

const PositionSchema = z.object({
  name: z.string(),
  stats: z.object({
    play: z.number(),
    win_rate: z.number(),
    pick_rate: z.number(),
    ban_rate: z.number().optional(),
    tier_data: z
      .object({ tier: z.number(), rank: z.number() })
      .partial()
      .optional(),
  }),
  counters: z.array(CounterSchema).optional().default([]),
});

const ChampionSchema = z.object({
  id: z.number(),
  average_stats: z.object({
    win_rate: z.number(),
    pick_rate: z.number(),
    ban_rate: z.number().optional(),
    tier: z.number().optional(),
  }),
  positions: z.array(PositionSchema),
});

const OpggResponseSchema = z.object({
  data: z.array(ChampionSchema),
  meta: z.object({ version: z.string().optional() }).optional(),
});

type OpggChampion = z.infer<typeof ChampionSchema>;

const pct = (fraction: number): number => Math.round(fraction * 1000) / 10;

function mapPosition(
  raw: OpggChampion["positions"][number]
): PositionStats | null {
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
      positions,
    });
  }

  return {
    patch: parsed.meta?.version ?? fallbackPatch,
    fetchedAt: new Date().toISOString(),
    champions,
  };
}

async function fetchAndBuildSnapshot(): Promise<MetaSnapshot> {
  const [res, champions, version] = await Promise.all([
    fetch(OPGG_URL, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 43200 },
    }),
    fetchAllChampions(),
    getLatestDdragonVersion(),
  ]);

  if (!res.ok) {
    throw new Error(`op.gg responded ${res.status}`);
  }

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

// Returns the current meta snapshot, or the last-good fallback, or null if the
// feed is down and nothing has ever been cached.
export async function getMetaSnapshot(): Promise<MetaSnapshot | null> {
  const fresh = (await getCached(FRESH_KEY).catch(() => null)) as MetaSnapshot | null;
  if (fresh) return fresh;

  try {
    const snapshot = await fetchAndBuildSnapshot();
    await setCached(FRESH_KEY, CACHE_TYPE, snapshot, FRESH_TTL_DAYS);
    await setCached(LAST_GOOD_KEY, CACHE_TYPE, snapshot, SNAPSHOT_TTL_DAYS);
    return snapshot;
  } catch (err) {
    logger.warn("[metaStatsService] fresh fetch failed, falling back to last-good snapshot", err);
    const lastGood = (await getCached(LAST_GOOD_KEY).catch(() => null)) as MetaSnapshot | null;
    return lastGood ?? null;
  }
}

const CountersDetailSchema = z.object({
  data: z.object({ counters: z.array(CounterSchema) }),
});

// Returns the full per-lane counter list for one champion (every opponent with a
// meaningful sample this patch — far richer than the ~3 counters in the bulk
// snapshot). Cached per champion+position with a last-good fallback.
export async function getChampionCounters(
  championId: number,
  position: CanonicalPosition
): Promise<MatchupEntry[] | null> {
  const freshKey = `meta:counters:${championId}:${position}`;
  const lastGoodKey = `${freshKey}:last-good`;

  const fresh = (await getCached(freshKey).catch(() => null)) as MatchupEntry[] | null;
  if (fresh) return fresh;

  try {
    const res = await fetch(`${OPGG_BASE}/ranked/${championId}/${CANONICAL_TO_OPGG[position]}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 43200 },
    });
    if (!res.ok) throw new Error(`op.gg counters responded ${res.status}`);

    const parsed = CountersDetailSchema.parse(await res.json());
    const entries: MatchupEntry[] = parsed.data.counters
      .filter((c) => c.play >= MIN_MATCHUP_GAMES)
      .map((c) => ({
        opponentId: c.champion_id,
        games: c.play,
        subjectWins: c.win,
        subjectWinRate: pct(c.win / c.play),
      }))
      .sort((a, b) => a.subjectWinRate - b.subjectWinRate);

    await setCached(freshKey, "meta-counters", entries, FRESH_TTL_DAYS);
    await setCached(lastGoodKey, "meta-counters", entries, SNAPSHOT_TTL_DAYS);
    return entries;
  } catch (err) {
    logger.warn(`[metaStatsService] counters fetch failed for ${championId}/${position}`, err);
    const lastGood = (await getCached(lastGoodKey).catch(() => null)) as MatchupEntry[] | null;
    return lastGood ?? null;
  }
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
