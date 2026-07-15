import Image from "next/image";
import { summonerSpellUrl } from "@/lib/ddragon";

export function SpellsRow({ spellIds }: { spellIds: number[] }) {
  const urls = spellIds.map(summonerSpellUrl).filter(Boolean);
  if (urls.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <h2 className="mb-3 font-display text-lg font-bold text-text">Summoner Spells</h2>
      <div className="flex gap-2">
        {urls.map((url, i) => (
          <Image
            key={i}
            src={url}
            alt="Summoner spell"
            width={40}
            height={40}
            unoptimized
            className="rounded-md ring-1 ring-border"
          />
        ))}
      </div>
    </div>
  );
}
