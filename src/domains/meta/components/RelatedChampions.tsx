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
      <h2 className="mb-3 font-display text-lg font-bold text-text">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {champions.map((c) => (
          <Link
            key={c.key}
            href={`/counters/${c.key}`}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-accent/40 hover:text-text"
          >
            <ChampionIcon name={c.key} size={22} />
            <span>{c.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
