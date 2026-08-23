import { z } from "zod";
import { getCached, setCached } from "@/lib/ai/aiCache";
import { logger } from "@/lib/utils/logger";
import {
  OPGG_BASE,
  FRESH_TTL_DAYS,
  SNAPSHOT_TTL_DAYS,
  MIN_MATCHUP_GAMES,
  CANONICAL_TO_OPGG,
  CounterSchema,
  opggFetch,
  pct,
  type SnapshotMode,
  type SnapshotTier,
} from "@/domains/meta/services/opggShared";
import { completeSkillOrder } from "@/domains/meta/services/skillOrder";
import type {
  BuildItemSet,
  CanonicalPosition,
  ChampionBuild,
  MatchupEntry,
} from "@/domains/meta/types";

const ItemSetSchema = z.object({
  ids: z.array(z.number()),
  play: z.number(),
  win: z.number(),
});
const RuneSchema = z.object({
  primary_page_id: z.number(),
  primary_rune_ids: z.array(z.number()),
  secondary_page_id: z.number(),
  secondary_rune_ids: z.array(z.number()),
  stat_mod_ids: z.array(z.number()).optional().default([]),
  play: z.number(),
  win: z.number(),
});
const SpellSchema = z.object({ ids: z.array(z.number()), play: z.number(), win: z.number() });
const SkillSchema = z.object({ order: z.array(z.string()), play: z.number(), win: z.number() });
const SkillMasterySchema = z.object({
  ids: z.array(z.string()),
  play: z.number(),
  win: z.number(),
});
const GameLengthSchema = z.object({ game_length: z.number(), rate: z.number() });
/**
 * `rank` is null for a patch the champion was not played in that lane — op.gg sends the point with
 * `rate: 0` and no rank rather than omitting it.
 *
 * It was declared as a plain number, which made Zod reject the whole payload: one gap in a
 * champion's trend history threw away its entire build, runes, items and counters for that lane.
 * Six of Syndra ADC's ten points are null, so that page had no build at all (LA-71).
 */
const TrendWinSchema = z.object({
  version: z.string(),
  rate: z.number(),
  rank: z.number().nullable(),
});

const DetailSchema = z.object({
  data: z.object({
    counters: z.array(CounterSchema).optional().default([]),
    runes: z.array(RuneSchema).optional().default([]),
    summoner_spells: z.array(SpellSchema).optional().default([]),
    core_items: z.array(ItemSetSchema).optional().default([]),
    boots: z.array(ItemSetSchema).optional().default([]),
    starter_items: z.array(ItemSetSchema).optional().default([]),
    last_items: z.array(ItemSetSchema).optional().default([]),
    skills: z.array(SkillSchema).optional().default([]),
    skill_masteries: z.array(SkillMasterySchema).optional().default([]),
    game_lengths: z.array(GameLengthSchema).optional().default([]),
    trends: z.object({ win: z.array(TrendWinSchema).optional().default([]) }).optional(),
  }),
});

export interface ChampionDetail {
  counters: MatchupEntry[];
  build: ChampionBuild;
}

const toItemSet = (s: z.infer<typeof ItemSetSchema>): BuildItemSet => ({
  ids: s.ids,
  games: s.play,
  winRate: pct(s.win / Math.max(1, s.play)),
});

function buildFromDetail(
  championId: number,
  data: z.infer<typeof DetailSchema>["data"]
): ChampionBuild {
  const topRune = data.runes[0];
  return {
    championId,
    runes: topRune
      ? {
          primaryPageId: topRune.primary_page_id,
          primaryRuneIds: topRune.primary_rune_ids,
          secondaryPageId: topRune.secondary_page_id,
          secondaryRuneIds: topRune.secondary_rune_ids,
          statShardIds: topRune.stat_mod_ids,
          games: topRune.play,
          winRate: pct(topRune.win / Math.max(1, topRune.play)),
        }
      : null,
    summonerSpellIds: data.summoner_spells[0]?.ids ?? [],
    starterItems: data.starter_items[0] ? toItemSet(data.starter_items[0]) : null,
    coreItems: data.core_items[0] ? toItemSet(data.core_items[0]) : null,
    boots: data.boots[0] ? toItemSet(data.boots[0]) : null,
    lateItemOptions: data.last_items.slice(0, 5).map(toItemSet),
    // op.gg stops at level 15; the remaining points follow from the levelling rules.
    skillOrder: completeSkillOrder(data.skills[0]?.order ?? [], data.skill_masteries[0]?.ids ?? []),
    skillMaxOrder: data.skill_masteries[0]?.ids ?? [],
    gameLengths: data.game_lengths.map((g) => ({
      minutes: g.game_length,
      winRate: pct(g.rate),
    })),
    // A point with no rank is a patch the champion was not played in this lane, not a patch it
    // ranked last in. Dropping it keeps the sparkline a record of real patches rather than a line
    // to the floor and back.
    trend: (data.trends?.win ?? [])
      .filter((t): t is typeof t & { rank: number } => t.rank !== null)
      .map((t) => ({
        version: t.version,
        winRate: pct(t.rate),
        rank: t.rank,
      })),
  };
}

function countersFromDetail(data: z.infer<typeof DetailSchema>["data"]): MatchupEntry[] {
  return data.counters
    .filter((c) => c.play >= MIN_MATCHUP_GAMES)
    .map((c) => ({
      opponentId: c.champion_id,
      games: c.play,
      subjectWins: c.win,
      subjectWinRate: pct(c.win / c.play),
    }))
    .sort((a, b) => a.subjectWinRate - b.subjectWinRate);
}

interface DetailOpts {
  mode?: SnapshotMode;
  tier?: SnapshotTier;
}

// Fetches the full per-champion detail (counters + build) for a lane, cached 12h
// with a last-good fallback. ARAM uses position segment NONE.
export async function getChampionDetail(
  championId: number,
  position: CanonicalPosition,
  opts: DetailOpts = {}
): Promise<ChampionDetail | null> {
  const mode = opts.mode ?? "ranked";
  const posSegment = mode === "aram" ? "NONE" : CANONICAL_TO_OPGG[position];
  const tierParam = mode === "ranked" && opts.tier ? `?tier=${opts.tier}` : "";
  const variant = `${mode}:${opts.tier ?? "default"}`;
  const freshKey = `meta:detail:${variant}:${championId}:${posSegment}`;
  const lastGoodKey = `${freshKey}:last-good`;

  const fresh = (await getCached(freshKey).catch(() => null)) as ChampionDetail | null;
  if (fresh) return fresh;

  try {
    const res = await opggFetch(`${OPGG_BASE}/${mode}/${championId}/${posSegment}${tierParam}`);
    if (!res.ok) throw new Error(`op.gg detail responded ${res.status}`);

    const { data } = DetailSchema.parse(await res.json());
    const detail: ChampionDetail = {
      counters: countersFromDetail(data),
      build: buildFromDetail(championId, data),
    };

    await setCached(freshKey, "meta-detail", detail, FRESH_TTL_DAYS);
    await setCached(lastGoodKey, "meta-detail", detail, SNAPSHOT_TTL_DAYS);
    return detail;
  } catch (err) {
    logger.warn(`[championDetailService] detail fetch failed for ${championId}/${posSegment}`, err);
    const lastGood = (await getCached(lastGoodKey).catch(() => null)) as ChampionDetail | null;
    return lastGood ?? null;
  }
}

/**
 * Fetches one champion+lane and writes both cache entries, whatever is already there.
 *
 * The sibling of `refreshSnapshotLastGood`, and for the same reason: `getChampionDetail` returns
 * early on a fresh copy and never touches the durable row, so a warmer built on it does nothing
 * for precisely the variants that need it. These are the long tail — `/builds/[champion]/[role]`,
 * `/counters/[champion]` — where a missing durable row means an empty page rather than a stale
 * one the day the feed goes away (LA-70 Faz 0).
 */
export async function refreshDetailLastGood(
  championId: number,
  position: CanonicalPosition,
  opts: DetailOpts = {}
): Promise<boolean> {
  const mode = opts.mode ?? "ranked";
  const posSegment = mode === "aram" ? "NONE" : CANONICAL_TO_OPGG[position];
  const tierParam = mode === "ranked" && opts.tier ? `?tier=${opts.tier}` : "";
  const freshKey = `meta:detail:${mode}:${opts.tier ?? "default"}:${championId}:${posSegment}`;

  try {
    const res = await opggFetch(`${OPGG_BASE}/${mode}/${championId}/${posSegment}${tierParam}`);
    if (!res.ok) throw new Error(`op.gg detail responded ${res.status}`);

    const { data } = DetailSchema.parse(await res.json());
    const detail: ChampionDetail = {
      counters: countersFromDetail(data),
      build: buildFromDetail(championId, data),
    };

    await setCached(freshKey, "meta-detail", detail, FRESH_TTL_DAYS);
    await setCached(`${freshKey}:last-good`, "meta-detail", detail, SNAPSHOT_TTL_DAYS);
    return true;
  } catch (err) {
    logger.warn(
      `[championDetailService] could not refresh last-good for ${championId}/${posSegment}`,
      err
    );
    return false;
  }
}

// The full per-lane counter list for one champion (used by counter/matchup/draft).
export async function getChampionCounters(
  championId: number,
  position: CanonicalPosition
): Promise<MatchupEntry[] | null> {
  const detail = await getChampionDetail(championId, position);
  return detail ? detail.counters : null;
}

// The recommended build (runes, items, skills, curves, trend) for one champion+lane.
export async function getChampionBuild(
  championId: number,
  position: CanonicalPosition,
  opts: DetailOpts = {}
): Promise<ChampionBuild | null> {
  const detail = await getChampionDetail(championId, position, opts);
  return detail ? detail.build : null;
}
