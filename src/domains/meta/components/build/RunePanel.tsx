import Image from "next/image";
import type { RuneBuild } from "@/domains/meta";
import type { RuneInfo } from "@/lib/ddragon/runesData";

function Rune({ info, size = 32 }: { info: RuneInfo | undefined; size?: number }) {
  if (!info) return <span className="inline-block rounded-full bg-surface-2" style={{ width: size, height: size }} />;
  return (
    <Image
      src={info.iconUrl}
      alt={info.name}
      title={info.name}
      width={size}
      height={size}
      unoptimized
      className="rounded-full bg-black/30"
    />
  );
}

export function RunePanel({
  runes,
  catalog,
}: {
  runes: RuneBuild;
  catalog: Map<number, RuneInfo>;
}) {
  const [keystone, ...primaryMinor] = runes.primaryRuneIds;

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-text">Runes</h2>
        <span className="text-sm font-semibold text-success">{runes.winRate.toFixed(1)}% win rate</span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Primary */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {catalog.get(runes.primaryPageId)?.name ?? "Primary"}
          </p>
          <div className="flex items-center gap-3">
            <Rune info={catalog.get(keystone)} size={44} />
            <div className="flex gap-2">
              {primaryMinor.map((id, i) => (
                <Rune key={`${id}-${i}`} info={catalog.get(id)} />
              ))}
            </div>
          </div>
        </div>

        {/* Secondary + shards */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {catalog.get(runes.secondaryPageId)?.name ?? "Secondary"}
          </p>
          <div className="flex items-center gap-2">
            {runes.secondaryRuneIds.map((id, i) => (
              <Rune key={`${id}-${i}`} info={catalog.get(id)} />
            ))}
            <span className="mx-1 h-6 w-px bg-border" />
            {runes.statShardIds.map((id, i) => (
              <Rune key={`shard-${id}-${i}`} info={catalog.get(id)} size={22} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
