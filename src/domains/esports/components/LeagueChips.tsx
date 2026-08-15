import Link from "next/link";
import type { EsportsLeague } from "@/domains/esports/types";

/**
 * League shortcuts.
 *
 * These navigate to each league's own hub rather than filtering this page in
 * place: a filtered copy of the schedule would be a near-duplicate of it at a
 * second URL, competing with both it and the league page (ADR-017 §3).
 */
export function LeagueChips({
  leagues,
  activeSlug,
}: {
  leagues: EsportsLeague[];
  activeSlug?: string;
}): React.ReactElement | null {
  if (leagues.length === 0) return null;

  return (
    <nav aria-label="Leagues" className="flex flex-wrap gap-1.5">
      {leagues.map((league) => {
        const active = league.slug === activeSlug;
        return (
          <Link
            key={league.id}
            href={`/esports/leagues/${league.slug}`}
            aria-current={active ? "page" : undefined}
            className={`tag-cut px-2.5 py-1 font-mono text-[11px] uppercase tracking-label transition-colors ${
              active
                ? "bg-accent text-background"
                : "bg-surface-2 text-text-body hover:bg-surface hover:text-text"
            }`}
          >
            {league.name}
          </Link>
        );
      })}
    </nav>
  );
}
