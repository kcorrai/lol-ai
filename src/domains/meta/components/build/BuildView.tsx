import { POSITION_LABELS, POSITION_SLUG } from "@/domains/meta";
import type { CanonicalPosition, ChampionBuild, PositionStats, SnapshotMode } from "@/domains/meta";
import type { ItemInfo } from "@/lib/ddragon/itemsData";
import type { RuneInfo } from "@/lib/ddragon/runesData";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BuildHero } from "./BuildHero";
import { BuildRail } from "./BuildRail";
import { BuildMatchups, type BuildMatchup } from "./BuildMatchups";
import { RunePanel } from "./RunePanel";
import { ItemBuildPath } from "./ItemBuildPath";
import { SkillOrder } from "./SkillOrder";
import { SpellsRow } from "./SpellsRow";
import { GameLengthCurve } from "./GameLengthCurve";
import { TrendSparkline } from "./TrendSparkline";
import { buildIntro, buildReasoning, buildJsonLd } from "./buildText";
import { jsonLdProps } from "@/lib/security/jsonLd";

export interface BuildViewData {
  championKey: string;
  name: string;
  title: string;
  tags: string[];
  gamePatch: string;
  rawPatch: string; // raw Data Dragon version for the freshness strip
  fetchedAt: string; // ISO snapshot timestamp
  matchCount?: number;
  overallTier: number;
  position: CanonicalPosition;
  availablePositions: CanonicalPosition[];
  stats: PositionStats;
  build: ChampionBuild;
  items: Map<number, ItemInfo>;
  runes: Map<number, RuneInfo>;
  counters: BuildMatchup[];
  mode?: SnapshotMode; // "ranked" (default) | "aram"
}

/** Whole hours since an ISO timestamp; 0 when the snapshot is somehow in the future. */
function hoursAgo(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.round((Date.now() - then) / 3_600_000));
}

export function BuildView(d: BuildViewData): React.ReactElement {
  const isAram = d.mode === "aram";
  const laneLabel = isAram ? "ARAM" : POSITION_LABELS[d.position];
  const selfHref = isAram
    ? `/aram/${d.championKey}`
    : `/builds/${d.championKey}/${POSITION_SLUG[d.position]}`;
  const textInput = {
    name: d.name,
    laneLabel,
    gamePatch: d.gamePatch,
    overallTier: d.overallTier,
    stats: d.stats,
    build: d.build,
    items: d.items,
    runes: d.runes,
    topCounterNames: d.counters.map((c) => c.name),
  };

  const coreItemNames = (d.build.coreItems?.ids ?? [])
    .map((id) => d.items.get(id)?.name)
    .filter(Boolean) as string[];
  // Stamp the primary node with the snapshot time as a freshness signal.
  const jsonLd = buildJsonLd(textInput, coreItemNames).map((ld, i) =>
    i === 0 ? { ...ld, dateModified: d.fetchedAt } : ld
  );

  const crumbs = [
    { name: "Free Tools", href: "/tools" },
    isAram ? { name: "ARAM", href: "/aram/tier-list" } : { name: "Builds", href: "/builds" },
    { name: `${d.name} ${laneLabel}`, href: selfHref },
  ];

  return (
    <>
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdProps(ld)}
        />
      ))}

      <div className="mx-auto max-w-[1240px] px-5 pt-6 md:px-8">
        <Breadcrumb items={crumbs} />
      </div>

      <BuildHero
        championKey={d.championKey}
        name={d.name}
        laneLabel={laneLabel}
        gamePatch={d.gamePatch}
        intro={buildIntro(textInput)}
        stats={d.stats}
        position={d.position}
        availablePositions={d.availablePositions}
        isAram={isAram}
      />

      <main className="mx-auto max-w-[1240px] px-5 py-6 md:px-8 md:py-7">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_306px]">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-[1.125rem]">
            {/* The answer first, in reading order. */}
            <ItemBuildPath build={d.build} catalog={d.items} />

            <div className="grid items-start gap-[1.125rem] lg:grid-cols-[1.55fr_1fr]">
              {d.build.runes ? (
                <RunePanel runes={d.build.runes} catalog={d.runes} />
              ) : (
                <div />
              )}
              <SpellsRow spellIds={d.build.summonerSpellIds} />
            </div>

            <SkillOrder build={d.build} />

            <div className="grid items-start gap-[1.125rem] lg:grid-cols-2">
              <GameLengthCurve points={d.build.gameLengths} />
              <TrendSparkline trend={d.build.trend} />
            </div>

            <BuildMatchups name={d.name} championKey={d.championKey} matchups={d.counters} />
          </div>

          <BuildRail
            name={d.name}
            championKey={d.championKey}
            rawPatch={d.rawPatch}
            gamePatch={d.gamePatch}
            hoursAgo={hoursAgo(d.fetchedAt)}
            matchCount={d.matchCount}
            reasoning={buildReasoning(textInput)}
            isAram={isAram}
          />
        </div>
      </main>
    </>
  );
}
