import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";

export interface RelatedChampion {
  key: string;
  name: string;
}

// A compact row of champion links pointing at their counter pages — internal
// linking to strengthen the SEO graph.
export function RelatedChampions({
  title,
  champions,
}: {
  title: string;
  champions: RelatedChampion[];
}) {
  if (champions.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="hud-label mb-3 flex items-center gap-3.5 text-[11px]">
        {title}
        <span className="h-px flex-1 bg-line-1" aria-hidden />
      </h2>
      <div className="flex flex-wrap gap-2">
        {champions.map((c) => (
          <Link
            key={c.key}
            href={`/counters/${c.key}`}
            className="tag-cut flex items-center gap-2 border border-border bg-surface py-1 pl-1 pr-3.5 text-sm text-text-muted transition-colors hover:border-accent/40 hover:text-text"
          >
            <ChampionIcon name={c.key} size={22} />
            <span>{c.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
