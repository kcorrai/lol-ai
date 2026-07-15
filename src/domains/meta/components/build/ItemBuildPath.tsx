import Image from "next/image";
import type { BuildItemSet, ChampionBuild } from "@/domains/meta";
import type { ItemInfo } from "@/lib/ddragon/itemsData";

function ItemIcon({ info, size = 40 }: { info: ItemInfo | undefined; size?: number }) {
  if (!info) return <span className="inline-block rounded-md bg-surface-2" style={{ width: size, height: size }} />;
  return (
    <Image
      src={info.iconUrl}
      alt={info.name}
      title={info.name}
      width={size}
      height={size}
      unoptimized
      className="rounded-md ring-1 ring-border"
    />
  );
}

function ItemGroup({
  label,
  set,
  catalog,
}: {
  label: string;
  set: BuildItemSet | null;
  catalog: Map<number, ItemInfo>;
}) {
  if (!set || set.ids.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <div className="flex items-center gap-1.5">
        {set.ids.map((id, i) => (
          <ItemIcon key={`${id}-${i}`} info={catalog.get(id)} />
        ))}
        <span className="ml-1.5 text-xs text-success">{set.winRate.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export function ItemBuildPath({
  build,
  catalog,
}: {
  build: ChampionBuild;
  catalog: Map<number, ItemInfo>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <h2 className="mb-4 font-display text-lg font-bold text-text">Item Build</h2>
      <div className="flex flex-col gap-4">
        <ItemGroup label="Starting items" set={build.starterItems} catalog={catalog} />
        <ItemGroup label="Core build" set={build.coreItems} catalog={catalog} />
        <ItemGroup label="Boots" set={build.boots} catalog={catalog} />
        {build.lateItemOptions.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Late-game options
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {build.lateItemOptions.map((set, i) => (
                <ItemIcon key={i} info={catalog.get(set.ids[0])} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
