import { getProSample, getCachedProSample } from "@/domains/esports/services/proSampleService";
import type { ProSampleQuery } from "@/domains/esports/services/proSampleService";
import type { ProChampionBuild, ProMeta, ProPresence } from "@/domains/esports/types";

export type ProMetaQuery = ProSampleQuery;

/** What the pros are picking, and how it is going for them. */
export async function getProMeta(query: ProMetaQuery = {}): Promise<ProMeta | null> {
  return (await getProSample(query))?.meta ?? null;
}

export interface ProBuildResult {
  build: ProChampionBuild;
  meta: ProMeta;
}

/**
 * How pros finished one champion, with the sample it came from.
 *
 * The meta travels with the build because a champion page has to state what the
 * numbers are out of, and it is the same walk either way — asking for it
 * separately would be a second cache read for data already in hand.
 */
export async function getProBuild(
  championId: string,
  query: ProMetaQuery = {}
): Promise<ProBuildResult | null> {
  const sample = await getProSample(query);
  if (!sample) return null;

  // Champion ids arrive from a URL, so the match is case-insensitive; the id we
  // keep is the feed's own casing.
  const key = Object.keys(sample.builds).find(
    (candidate) => candidate.toLowerCase() === championId.toLowerCase()
  );
  if (!key) return null;

  return { build: sample.builds[key], meta: sample.meta };
}

/** Champion ids with at least one pro game in the sample — the pages worth prerendering. */
export async function getProChampionIds(query: ProMetaQuery = {}): Promise<string[]> {
  const sample = await getProSample(query);
  return sample ? Object.keys(sample.builds).sort() : [];
}

/**
 * What pro play has to say about one champion, but only if it is already known.
 *
 * The champion cluster's entry point (TASK-310). Returns null on a cold cache
 * rather than filling it, so a ranked build page never pays for a pro strip.
 */
/**
 * Pro pick counts for every champion in the sample, keyed by lowercased id.
 *
 * The tier list's pro column (TASK-310). Cache-only for the same reason
 * `getCachedProBuild` is: a ranked tier list must not wait on a walk of the
 * esports feed, and the warm job (TASK-305) is what keeps this answerable.
 * Null on a cold cache, and the column is then not rendered at all — a ranked
 * page owes nobody an explanation of why an esports number is missing.
 *
 * Lowercased because the two sides disagree about casing: op.gg's champion keys
 * and the feed's champion ids are both Data Dragon ids but arrive from different
 * places, so `MonkeyKing` and `Monkeyking` have to meet somewhere.
 */
export async function getProPresence(): Promise<Record<string, ProPresence> | null> {
  const sample = await getCachedProSample();
  if (!sample) return null;

  const presence: Record<string, ProPresence> = {};
  for (const champion of sample.meta.champions) {
    presence[champion.championId.toLowerCase()] = {
      championId: champion.championId,
      picks: champion.picks,
      pickRate: champion.pickRate,
    };
  }
  return presence;
}

export async function getCachedProBuild(championId: string): Promise<ProBuildResult | null> {
  const sample = await getCachedProSample();
  if (!sample) return null;

  const key = Object.keys(sample.builds).find(
    (candidate) => candidate.toLowerCase() === championId.toLowerCase()
  );
  if (!key) return null;

  return { build: sample.builds[key], meta: sample.meta };
}
