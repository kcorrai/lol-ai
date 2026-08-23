import {
  ALL_POSITIONS,
  POSITION_LABELS,
  POSITION_SLUG,
  SNAPSHOT_REGIONS,
  SNAPSHOT_TIERS,
  TIER_LABELS,
  formatGamePatch,
} from "@/domains/meta";
import type { CanonicalPosition, RoleTierList, SnapshotTier } from "@/domains/meta";
import type { ProPresence } from "@/domains/esports";
import { regionLabel } from "@/lib/riot/regions";
import { StatBlock } from "@/components/dashboard/laneiq/HudPanel";
import { TierListConsole, type TierListTab } from "./TierListConsole";
import type { TierRow } from "./sortEntries";

interface TierListViewProps {
  mode: "ranked" | "aram";
  position: CanonicalPosition | null; // null in ARAM, which has no lanes
  list: RoleTierList | null;
  activeTier: SnapshotTier | null; // current ?tier= rank filter (null = default bracket)
  activeRegion: string | null; // current ?region= platform (null = op.gg's global numbers)
  title: string;
  subtitle: string;
  /**
   * Pro pick rates keyed by lowercased champion id, or null when the pro sample
   * is not warm. Null hides the column rather than showing it empty.
   */
  proPresence: Record<string, ProPresence> | null;
}

/** Whole hours since an ISO timestamp; 0 when the snapshot is somehow in the future. */
function hoursAgo(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.round((Date.now() - then) / 3_600_000));
}

// The shared body for every tier list: the title block with its freshness stats, then the
// console — mode/lane/rank filters, the top-three podium and the ranking table.
export function TierListView({
  mode,
  position,
  list,
  activeTier,
  activeRegion,
  title,
  subtitle,
  proPresence,
}: TierListViewProps): React.ReactElement {
  const aram = mode === "aram";
  // Pro play is Summoner's Rift, so the column means nothing on the ARAM list.
  const showPro = !aram && proPresence !== null;
  const rows: TierRow[] = (list?.entries ?? []).map((entry) => ({
    ...entry,
    proPickRate: proPresence?.[entry.championKey.toLowerCase()]?.pickRate ?? null,
  }));
  const rolePath = position ? `/tools/tier-list/${POSITION_SLUG[position]}` : "/tools/tier-list";

  const modeTabs: TierListTab[] = [
    { label: "Ranked", href: "/tools/tier-list", active: !aram },
    { label: "ARAM", href: "/aram/tier-list", active: aram },
  ];

  const laneTabs: TierListTab[] | null = aram
    ? null
    : ALL_POSITIONS.map((pos) => ({
        label: POSITION_LABELS[pos],
        href: `/tools/tier-list/${POSITION_SLUG[pos]}`,
        active: pos === position,
      }));

  /**
   * A chip changes one filter and keeps the other.
   *
   * Without this, picking a region would silently reset the rank bracket and the reader would be
   * looking at a different question than the one they thought they asked.
   */
  const href = (next: { tier?: SnapshotTier | null; region?: string | null }): string => {
    const tier = next.tier === undefined ? activeTier : next.tier;
    const region = next.region === undefined ? activeRegion : next.region;
    const params = new URLSearchParams();
    if (tier) params.set("tier", tier);
    if (region) params.set("region", region);
    const query = params.toString();
    return query ? `${rolePath}?${query}` : rolePath;
  };

  // ARAM is one dataset with no rank brackets, so the row collapses to the single view it has.
  const rankTabs: TierListTab[] = aram
    ? [{ label: "All ranks", href: "/aram/tier-list", active: true }]
    : [
        { label: "Default", href: href({ tier: null }), active: activeTier === null },
        ...SNAPSHOT_TIERS.map((t) => ({
          label: TIER_LABELS[t],
          href: href({ tier: t }),
          active: t === activeTier,
        })),
      ];

  /**
   * op.gg's numbers really do differ per platform — Ahri mid is rank 7 globally, 5 on EUW and 12
   * on KR — and every competitor offers this. Global stays the default because each platform is a
   * separate snapshot to fetch and hold (LA-71).
   */
  const regionTabs: TierListTab[] | null = aram
    ? null
    : [
        { label: "Global", href: href({ region: null }), active: activeRegion === null },
        ...SNAPSHOT_REGIONS.map((r) => ({
          label: regionLabel(r),
          href: href({ region: r }),
          active: r === activeRegion,
        })),
      ];

  const roleLabel = aram ? "ARAM" : position ? POSITION_LABELS[position] : "All lanes";
  const lowConfidenceMajority =
    list !== null &&
    list.entries.length > 0 &&
    list.entries.filter((e) => e.lowConfidence).length > list.entries.length / 2;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-7">
        <div>
          <h1 className="font-display text-[34px] font-black uppercase leading-[0.98] tracking-[0.02em] text-text md:text-[44px]">
            {title}
          </h1>
          <p className="mt-3 max-w-[58ch] text-[15px] text-text-body">{subtitle}</p>
        </div>
        {list && (
          <div className="flex flex-wrap gap-7 pb-1">
            <StatBlock
              label={aram ? "ARAM games" : "Games analyzed"}
              value={list.matchCount ? list.matchCount.toLocaleString() : "—"}
            />
            <StatBlock label="Updated" value={`${hoursAgo(list.fetchedAt)}h`} unit="ago" />
            <StatBlock label="Patch" value={formatGamePatch(list.patch)} />
          </div>
        )}
      </div>

      <div className="mt-6">
        {lowConfidenceMajority && (
          <p className="notch mb-4 border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning/90">
            This bracket has a small sample this patch, so tiers below are low-confidence and
            ordered by games played. Broader brackets give more reliable rankings.
          </p>
        )}

        {!list || list.entries.length === 0 ? (
          <p className="notch border border-dashed border-border px-4 py-12 text-center text-text-muted">
            {aram ? "ARAM tier data" : "Tier data"} is unavailable right now. Please try again
            shortly.
          </p>
        ) : (
          <TierListConsole
            entries={rows}
            modeTabs={modeTabs}
            laneTabs={laneTabs}
            rankTabs={rankTabs}
            regionTabs={regionTabs}
            roleLabel={roleLabel}
            hrefBase={aram ? "/aram" : "/counters"}
            showBan={!aram}
            showMovement={!aram}
            showPro={showPro}
          />
        )}
      </div>
    </>
  );
}
