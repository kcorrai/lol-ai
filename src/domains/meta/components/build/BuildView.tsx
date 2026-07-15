import Link from "next/link";
import Image from "next/image";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { championSplashUrl } from "@/lib/ddragon";
import { POSITION_LABELS, POSITION_SLUG } from "@/domains/meta";
import type { CanonicalPosition, ChampionBuild, PositionStats, SnapshotMode } from "@/domains/meta";
import type { ItemInfo } from "@/lib/ddragon/itemsData";
import type { RuneInfo } from "@/lib/ddragon/runesData";
import { ToolBreadcrumb } from "@/domains/meta/components/ToolBreadcrumb";
import { DataFreshness } from "@/domains/meta/components/DataFreshness";
import { Stat, BuildLink } from "./BuildViewParts";
import { RunePanel } from "./RunePanel";
import { ItemBuildPath } from "./ItemBuildPath";
import { SkillOrder } from "./SkillOrder";
import { SpellsRow } from "./SpellsRow";
import { GameLengthCurve } from "./GameLengthCurve";
import { TrendSparkline } from "./TrendSparkline";
import { buildIntro, buildReasoning, buildJsonLd } from "./buildText";

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
  counters: { key: string; name: string }[];
  mode?: SnapshotMode; // "ranked" (default) | "aram"
}

export function BuildView(d: BuildViewData) {
  const isAram = d.mode === "aram";
  const laneLabel = isAram ? "ARAM" : POSITION_LABELS[d.position];
  const selfHref = isAram ? `/aram/${d.championKey}` : `/builds/${d.championKey}/${POSITION_SLUG[d.position]}`;
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
    <div className="mx-auto max-w-5xl px-4 py-12">
      {jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}

      <ToolBreadcrumb items={crumbs} />

      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-border">
        <Image
          src={championSplashUrl(d.championKey)}
          alt={`${d.name} splash art`}
          width={1215}
          height={280}
          className="h-40 w-full object-cover object-top md:h-52"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 p-6">
          <h1 className="font-display text-3xl font-black text-text md:text-4xl">
            {d.name} Build — {laneLabel}, Patch {d.gamePatch}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Runes, items, and skill order with the highest win rate.
          </p>
        </div>
      </div>

      {/* Lane switcher */}
      {d.availablePositions.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {d.availablePositions.map((pos) => (
            <Link
              key={pos}
              href={`/builds/${d.championKey}/${POSITION_SLUG[pos]}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                pos === d.position
                  ? "bg-accent text-background"
                  : "border border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text"
              }`}
            >
              {POSITION_LABELS[pos]}
            </Link>
          ))}
        </div>
      )}

      {/* Stat strip */}
      <div className="mb-6 flex flex-wrap gap-4 text-sm">
        <Stat label="Win rate" value={`${d.stats.winRate.toFixed(1)}%`} good={d.stats.winRate >= 50} />
        <Stat label="Pick rate" value={`${d.stats.pickRate.toFixed(1)}%`} />
        {!isAram && <Stat label="Ban rate" value={`${d.stats.banRate.toFixed(1)}%`} />}
        <Stat label="Games" value={d.stats.games.toLocaleString()} />
      </div>

      <DataFreshness
        fetchedAt={d.fetchedAt}
        patch={d.rawPatch}
        matchCount={d.matchCount}
        gamesLabel={isAram ? "ARAM games analyzed" : "ranked games analyzed"}
        className="mb-6"
      />

      {/* Intro text */}
      <p className="mb-8 leading-relaxed text-text-muted">{buildIntro(textInput)}</p>

      {/* Build grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {d.build.runes && <RunePanel runes={d.build.runes} catalog={d.runes} />}
        <SpellsRow spellIds={d.build.summonerSpellIds} />
        <div className="md:col-span-2">
          <ItemBuildPath build={d.build} catalog={d.items} />
        </div>
        <SkillOrder build={d.build} />
        <GameLengthCurve points={d.build.gameLengths} />
        <div className="md:col-span-2">
          <TrendSparkline trend={d.build.trend} />
        </div>
      </div>

      <p className="mt-8 leading-relaxed text-text-muted">{buildReasoning(textInput)}</p>

      {/* Counters preview */}
      {d.counters.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 font-display text-lg font-bold text-text">Best counters for {d.name}</h2>
          <div className="flex flex-wrap gap-2">
            {d.counters.slice(0, 8).map((c) => (
              <Link
                key={c.key}
                href={`/counters/${c.key}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-muted hover:border-accent/40 hover:text-text"
              >
                <ChampionIcon name={c.key} size={22} />
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Internal links */}
      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        {isAram ? (
          <>
            <BuildLink href={`/builds/${d.championKey}`}>{d.name} ranked build →</BuildLink>
            <BuildLink href="/aram/tier-list">ARAM tier list →</BuildLink>
          </>
        ) : (
          <>
            <BuildLink href={`/aram/${d.championKey}`}>{d.name} ARAM build →</BuildLink>
            <BuildLink href="/tools/tier-list">Tier list →</BuildLink>
          </>
        )}
        <BuildLink href={`/counters/${d.championKey}`}>{d.name} counters →</BuildLink>
        <BuildLink href={`/champions/${d.championKey}`}>{d.name} champion guide →</BuildLink>
      </div>
    </div>
  );
}
