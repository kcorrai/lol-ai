import Image from "next/image";
import type { DdragonSkin } from "@/lib/ddragon/championsData";

// Splash gallery. `championKey` is the Data Dragon image key (e.g. "MonkeyKing").
export function ChampionSkins({
  championKey,
  championName,
  skins,
}: {
  championKey: string;
  championName: string;
  skins: DdragonSkin[];
}) {
  if (skins.length <= 1) return null;

  return (
    <div className="notch min-w-0 border border-border bg-surface p-4 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="hud-label text-[10.5px]">{"// Skins"}</h2>
        <span className="text-xs text-text-muted/60">{skins.length} total</span>
      </div>

      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {skins.map((skin) => {
          const label = skin.num === 0 ? `Default ${championName}` : skin.name;
          return (
            <figure key={skin.id} className="w-56 shrink-0 snap-start">
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border">
                <Image
                  src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championKey}_${skin.num}.jpg`}
                  alt={label}
                  fill
                  sizes="224px"
                  className="object-cover object-top"
                  unoptimized
                />
              </div>
              <figcaption className="mt-1.5 truncate text-xs text-text-muted" title={label}>
                {label}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
