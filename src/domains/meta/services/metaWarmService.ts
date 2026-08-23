import { logger } from "@/lib/utils/logger";
import { getMetaSnapshot, refreshSnapshotLastGood } from "@/domains/meta/services/metaStatsService";
import { refreshDetailLastGood } from "@/domains/meta/services/championDetailService";
import { SNAPSHOT_TIERS } from "@/domains/meta/services/opggShared";
import type { SnapshotTier } from "@/domains/meta/services/opggShared";
import {
  detailTargets,
  sliceForDay,
  targetsInSlice,
} from "@/domains/meta/services/metaWarmRotation";

/**
 * Keeps a last-good copy of every op.gg-backed surface on hand.
 *
 * `metaStatsService` and `championDetailService` both keep a never-expiring last-good row and fall
 * back to it when the feed is unreachable — but only for variants somebody has already asked for.
 * Nothing refreshes them on a schedule, so a variant nobody visited has no row at all, and the day
 * the feed goes away those pages render empty rather than stale. That is most of the long tail:
 * `/builds/[champion]/[role]`, `/counters/[champion]`, `/aram/[champion]`.
 *
 * This walks the variants on a timer so every one of them has a recent copy behind it. It buys
 * time rather than independence — LA-70 is the actual exit — but it turns "goes dark without
 * warning" into "at most a few days stale", which is the difference between an outage and a
 * degradation.
 */

/** A week to cover the whole roster, so nothing on the site is ever more than that stale. */
const DETAIL_SLICES = 7;

/** Vercel allows 300s; stop early enough to log a result rather than be killed mid-walk. */
const DEFAULT_DEADLINE_MS = 240_000;

/** The feed is somebody else's unofficial endpoint. Walking it politely costs us nothing. */
const GAP_MS = 150;

export interface WarmMetaResult {
  snapshots: number;
  details: number;
  failures: number;
  /** Targets this slice held but the deadline cut off — never dropped silently. */
  skipped: number;
  slice: number;
  slices: number;
}

export interface WarmMetaOptions {
  nowMs?: number;
  deadlineMs?: number;
  /** Test seam. Real runs keep the pause; a suite waiting it out would be pure dead time. */
  gapMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ranked at every bracket the filter UI offers, plus ARAM. Nine calls, and they back the tier
 * list, the meta report, the draft catalogue and the marketing page — the surfaces where going
 * dark is most visible, so they are refreshed in full on every run rather than rotated.
 */
async function warmSnapshots(gapMs: number): Promise<{ ok: number; failed: number }> {
  const variants: { mode: "ranked" | "aram"; tier?: SnapshotTier }[] = [
    { mode: "ranked" },
    ...SNAPSHOT_TIERS.map((tier) => ({ mode: "ranked" as const, tier })),
    { mode: "aram" },
  ];

  let ok = 0;
  let failed = 0;
  for (const variant of variants) {
    // Deliberately not getMetaSnapshot: that returns a fresh Redis copy without ever touching
    // the durable last-good row, so a warmer built on it reports success while writing nothing.
    const written = await refreshSnapshotLastGood(variant).catch(() => false);
    if (written) ok++;
    else failed++;
    await sleep(gapMs);
  }
  return { ok, failed };
}

export async function warmMetaCache(options: WarmMetaOptions = {}): Promise<WarmMetaResult> {
  // Two different clocks on purpose: `nowMs` picks the day's slice and can be pinned, while the
  // deadline is elapsed wall time in this invocation and always real — a pinned start would let
  // an over-running walk sail past the platform's limit.
  const slice = sliceForDay(options.nowMs ?? Date.now(), DETAIL_SLICES);
  const deadline = Date.now() + (options.deadlineMs ?? DEFAULT_DEADLINE_MS);
  const gapMs = options.gapMs ?? GAP_MS;

  const snapshots = await warmSnapshots(gapMs);

  // The default ranked snapshot is also the index of what details exist: which champions are
  // played in which lanes this patch. A plain read is right here — the row was just refreshed
  // above, and this only needs to know the shape of the roster. Without it there is nothing to
  // walk, and it having failed means the feed is down, so warming details would only add noise.
  const index = await getMetaSnapshot({ mode: "ranked" }).catch(() => null);
  const targets = index ? targetsInSlice(detailTargets(index), slice, DETAIL_SLICES) : [];

  let details = 0;
  let failures = snapshots.failed;
  let walked = 0;

  for (const target of targets) {
    if (Date.now() >= deadline) break;
    walked++;
    const written = await refreshDetailLastGood(target.championId, target.position).catch(
      () => false
    );
    if (written) details++;
    else failures++;
    await sleep(gapMs);
  }

  const result: WarmMetaResult = {
    snapshots: snapshots.ok,
    details,
    failures,
    skipped: targets.length - walked,
    slice,
    slices: DETAIL_SLICES,
  };

  logger.info("[meta-warm] done", { ...result });
  return result;
}
