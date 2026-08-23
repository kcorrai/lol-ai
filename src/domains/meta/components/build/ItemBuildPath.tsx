import Image from "next/image";
import type { BuildItemSet, ChampionBuild } from "@/domains/meta";
import type { ItemInfo } from "@/lib/ddragon/itemsData";
import { winRateDelta } from "./winRateDelta";

function ItemIcon({
  info,
  size = 38,
  accent = false,
}: {
  info: ItemInfo | undefined;
  size?: number;
  accent?: boolean;
}) {
  const frame = `tag-cut shrink-0 border ${accent ? "border-accent" : "border-line-2"}`;
  if (!info) {
    return <span className={`${frame} inline-block bg-surface-dark`} style={{ width: size, height: size }} />;
  }
  return (
    <Image
      src={info.iconUrl}
      alt={info.name}
      title={info.name}
      width={size}
      height={size}
      unoptimized
      className={frame}
    />
  );
}

interface CellProps {
  label: string;
  note: string;
  set: BuildItemSet | null;
  ids?: number[];
  catalog: Map<number, ItemInfo>;
  accent?: boolean;
  /** The champion's own win rate in this lane, which is what the cell's number is measured against. */
  baselineWinRate: number;
}

function Cell({
  label,
  note,
  set,
  ids,
  catalog,
  accent = false,
  baselineWinRate,
}: CellProps): React.ReactElement | null {
  const itemIds = ids ?? set?.ids ?? [];
  if (itemIds.length === 0) return null;
  const delta = set ? winRateDelta(set.winRate, baselineWinRate, set.games) : null;
  return (
    <div className={`border-b border-line-1 px-4 py-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 ${accent ? "bg-accent/[0.06]" : ""}`}>
      <div className="mb-2.5 flex items-center justify-between gap-2.5">
        <span className="hud-label text-[9.5px]">{label}</span>
        <span className="flex items-baseline gap-1.5">
          <span
            className={`font-mono text-xs font-bold ${accent ? "text-accent" : "text-text-body"}`}
          >
            {set ? `${set.winRate.toFixed(1)}%` : "—"}
          </span>
          {delta && (
            <span
              title={`${delta.label} points against ${baselineWinRate.toFixed(1)}% for the champion in this lane`}
              className={`font-mono text-[10px] ${delta.better ? "text-accent" : "text-danger"}`}
            >
              {delta.label}
            </span>
          )}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {itemIds.map((id, i) => (
          <ItemIcon key={`${id}-${i}`} info={catalog.get(id)} accent={accent} />
        ))}
      </div>
      <p className="mt-2.5 font-mono text-[10px] tracking-[0.1em] text-text-faint">{note}</p>
    </div>
  );
}

/**
 * The build path as one row: what you start with, what you rush, boots, and what is optional.
 * The core cell is the accented one because it is the answer the page exists to give.
 */
export function ItemBuildPath({
  build,
  catalog,
  baselineWinRate,
}: {
  build: ChampionBuild;
  catalog: Map<number, ItemInfo>;
  /** The champion's win rate in this lane — every cell's number is read against it. */
  baselineWinRate: number;
}): React.ReactElement {
  const core = build.coreItems;
  return (
    <section className="notch glow-accent-soft border border-accent bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-1 bg-surface-2 px-5 py-3.5">
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text">
          {`// The build${core ? ` · ${core.winRate.toFixed(1)}% win rate` : ""}`}
        </span>
        <span className="hud-label text-[10.5px]">
          {`vs ${baselineWinRate.toFixed(1)}% for the champion`}
        </span>
        <span className="hud-label text-[10.5px]">Highest win rate path this patch</span>
      </div>
      <div className="grid lg:grid-cols-[auto_auto_auto_minmax(0,1fr)]">
        <Cell
          label="Start"
          note="First back"
          set={build.starterItems}
          catalog={catalog}
          baselineWinRate={baselineWinRate}
        />
        <Cell
          label="Core · in order"
          note="The whole build"
          set={core}
          catalog={catalog}
          accent
          baselineWinRate={baselineWinRate}
        />
        <Cell
          label="Boots"
          note="Situational swap"
          set={build.boots}
          catalog={catalog}
          baselineWinRate={baselineWinRate}
        />
        {/* No set, so no delta: this cell is one icon from each of several options rather than one
            option with a win rate of its own. */}
        <Cell
          label="Late options"
          note="Pick one, not all"
          set={null}
          ids={build.lateItemOptions.map((s) => s.ids[0])}
          catalog={catalog}
          baselineWinRate={baselineWinRate}
        />
      </div>
    </section>
  );
}
