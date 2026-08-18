import Link from "next/link";
import { StandingsRail } from "@/domains/esports/components/StandingsRail";
import type { EsportsLeague, EsportsTeam, StandingsRow } from "@/domains/esports/types";

interface TeamRailProps {
  team: EsportsTeam;
  /** Resolved from the league index; the feed's team payload carries no id. */
  league: EsportsLeague | undefined;
  standings: StandingsRow[];
}

/** The column beside a team page: where it sits, and what to do with that. */
export function TeamRail({ team, league, standings }: TeamRailProps): React.ReactElement {
  return (
    <aside className="grid gap-3.5 xl:sticky xl:top-[calc(var(--esports-sticky-top,0px)+1rem)]">
      {league && (
        <StandingsRail
          rows={standings}
          highlightId={team.id}
          leagueName={league.name}
          fullHref={`/esports/leagues/${league.slug}`}
        />
      )}

      <section className="notch glow-accent-soft bg-hero-fade border border-accent bg-surface px-4 py-4">
        <h2 className="font-display text-[15px] font-extrabold uppercase leading-tight tracking-[0.03em] text-text">
          Steal {team.code}&apos;s draft
        </h2>
        <p className="mt-2 text-[13px] text-text-body">
          Run their comps through the same analyzer you use on your own ranked drafts.
        </p>
        <Link
          href="/tools/draft-analyzer"
          className="tag-cut btn-glow mt-3.5 inline-flex items-center bg-accent px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400"
        >
          Open draft analyzer →
        </Link>
      </section>

      {team.league && (
        <p className="text-sm text-text-muted">
          See the full {team.league.name} standings and schedule on the{" "}
          <Link
            href={league ? `/esports/leagues/${league.slug}` : "/esports/leagues"}
            className="text-accent hover:underline"
          >
            {league ? `${team.league.name} page` : "league pages"}
          </Link>
          , or what is on next across every league in the{" "}
          <Link href="/esports/schedule" className="text-accent hover:underline">
            esports schedule
          </Link>
          .
        </p>
      )}
    </aside>
  );
}
