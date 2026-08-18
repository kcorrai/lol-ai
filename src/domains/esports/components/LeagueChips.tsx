import { Chip } from "@/domains/esports/components/Chip";
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
      {leagues.map((league) => (
        <Chip
          key={league.id}
          href={`/esports/leagues/${league.slug}`}
          active={league.slug === activeSlug}
        >
          {league.name}
        </Chip>
      ))}
    </nav>
  );
}
