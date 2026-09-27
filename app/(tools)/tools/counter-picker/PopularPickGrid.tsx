import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { RelatedChampion } from "@/domains/meta/components/RelatedChampions";

/**
 * The counter picker's opening move: the champions most people are here to look up, as big
 * targets. An empty page with a dropdown asked the visitor to know what they wanted; most of them
 * want one of these.
 */
export function PopularPickGrid({
  champions,
}: {
  champions: RelatedChampion[];
}): React.ReactElement | null {
  if (champions.length === 0) return null;
  return (
    <div>
      <p className="hud-label mb-3 text-[10px]">Most picked this patch</p>
      <ul className="mx-auto grid max-w-[760px] grid-cols-3 gap-2 sm:grid-cols-5">
        {champions.map((c) => (
          <li key={c.key}>
            <Link
              href={`/tools/counter-picker?champion=${c.key}`}
              className="notch-sm group flex flex-col items-center gap-2 border border-border bg-surface-dark px-2 py-3 transition-colors hover:border-accent/50"
            >
              <ChampionIcon name={c.key} size={48} />
              <span className="w-full truncate text-center text-xs font-semibold text-text-body group-hover:text-accent">
                {c.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
