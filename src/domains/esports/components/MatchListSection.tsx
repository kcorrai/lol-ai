import { MatchRow } from "@/domains/esports/components/MatchRow";
import type { EsportsEvent } from "@/domains/esports/types";

/**
 * A titled list of one league's matches — its fixtures or its results. Renders
 * nothing when there are none, so a page can offer both without checking.
 */
export function MatchListSection({
  title,
  events,
}: {
  title: string;
  events: EsportsEvent[];
}): React.ReactElement | null {
  if (events.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
        {title}
      </h2>
      <div className="grid gap-2">
        {events.map((event) => (
          <MatchRow
            key={event.matchId}
            event={event}
            href={`/esports/matches/${event.matchId}`}
            showLeague={false}
            withDate
          />
        ))}
      </div>
    </section>
  );
}
