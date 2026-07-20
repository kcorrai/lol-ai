import Link from "next/link";
import {
  ALL_POSITIONS,
  POSITION_LABELS,
  POSITION_SLUG,
  SNAPSHOT_TIERS,
  TIER_LABELS,
} from "@/domains/meta";
import type { CanonicalPosition, RoleTierList, SnapshotTier } from "@/domains/meta";
import { DataFreshness } from "@/domains/meta/components/DataFreshness";
import { SortableTierTable } from "./SortableTierTable";

interface TierListViewProps {
  position: CanonicalPosition;
  list: RoleTierList | null;
  activeTier: SnapshotTier | null; // current ?tier= rank filter (null = default bracket)
}

const pill =
  "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors";
const activePill = "bg-accent text-background";
const idlePill =
  "border border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text";

// Shared body for the ranked role tier lists: mode + lane tabs, rank-bracket
// filter, and the ranking table with a patch-movement column.
export function TierListView({ position, list, activeTier }: TierListViewProps) {
  const rolePath = `/tools/tier-list/${POSITION_SLUG[position]}`;

  return (
    <>
      {/* Mode tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className={`${pill} ${activePill}`}>Ranked</span>
        <Link href="/aram/tier-list" className={`${pill} ${idlePill}`}>
          ARAM
        </Link>
      </div>

      {/* Lane tabs (path-based hubs) */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {ALL_POSITIONS.map((pos) => (
          <Link
            key={pos}
            href={`/tools/tier-list/${POSITION_SLUG[pos]}`}
            className={`${pill} ${pos === position ? activePill : idlePill}`}
          >
            {POSITION_LABELS[pos]}
          </Link>
        ))}
      </div>

      {/* Rank bracket filter */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] uppercase tracking-wide text-text-muted">Rank</span>
        <Link
          href={rolePath}
          className={`${pill} ${activeTier === null ? activePill : idlePill}`}
        >
          Default
        </Link>
        {SNAPSHOT_TIERS.map((t) => (
          <Link
            key={t}
            href={`${rolePath}?tier=${t}`}
            className={`${pill} ${t === activeTier ? activePill : idlePill}`}
          >
            {TIER_LABELS[t]}
          </Link>
        ))}
      </div>

      {list && (
        <DataFreshness fetchedAt={list.fetchedAt} patch={list.patch} matchCount={list.matchCount} className="mb-4" />
      )}

      {list && list.entries.length > 0 &&
        list.entries.filter((e) => e.lowConfidence).length > list.entries.length / 2 && (
          <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-300/90">
            This bracket has a small sample this patch, so tiers below are low-confidence and ordered by
            games played. Broader brackets give more reliable rankings.
          </p>
        )}

      {!list || list.entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-text-muted">
          Tier data is unavailable right now. Please try again shortly.
        </p>
      ) : (
        <SortableTierTable entries={list.entries} showMovement />
      )}
    </>
  );
}
