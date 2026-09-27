import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { relativeTiming, tournamentName } from "@/domains/esports";
import type { TournamentOverview, TournamentOverviewEntry } from "@/domains/esports";

const PER_COLUMN = 3;

function Row({
  entry,
  children,
}: {
  entry: TournamentOverviewEntry;
  children: React.ReactNode;
}): React.ReactElement {
  const { tournament, league } = entry;
  return (
    <Link
      href={`/esports/tournaments/${tournament.slug}`}
      className="flex items-center gap-2.5 border-t border-line-1 px-3 py-2.5 transition-colors first:border-t-0 hover:bg-surface-2/60"
    >
      {league.image ? (
        <Image
          src={league.image}
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] shrink-0 object-contain"
          aria-hidden
          unoptimized
        />
      ) : (
        <span className="h-[22px] w-[22px] shrink-0" aria-hidden />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[13px] font-bold uppercase text-text">
          {tournamentName(tournament, league)}
        </span>
        <span className="block truncate text-xs text-text-muted">{children}</span>
      </span>
    </Link>
  );
}

function Column({
  title,
  tone,
  entries,
  empty,
  render,
}: {
  title: string;
  tone: string;
  entries: TournamentOverviewEntry[];
  empty: string;
  render: (entry: TournamentOverviewEntry) => React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-w-0 border border-border bg-surface">
      <p
        className={`border-b border-line-1 px-3 py-2 font-mono text-[11px] uppercase tracking-label ${tone}`}
      >
        {title}
      </p>
      {entries.length > 0 ? (
        entries.slice(0, PER_COLUMN).map((entry) => (
          <Row key={entry.tournament.id} entry={entry}>
            {render(entry)}
          </Row>
        ))
      ) : (
        <p className="px-3 py-3 text-xs text-text-muted">{empty}</p>
      )}
    </div>
  );
}

/**
 * The tournament picture in one glance: what is on, what starts next and who
 * just won — each a click from its full page.
 */
export function HubTournaments({ overview }: { overview: TournamentOverview }): React.ReactElement {
  const { today, running, upcoming, finished } = overview;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Column
        title="On now"
        tone="text-accent"
        entries={running}
        empty="No tournament is being played today."
        render={(entry) => relativeTiming(entry.tournament, today)}
      />
      <Column
        title="Coming up"
        tone="text-warning"
        entries={upcoming}
        empty="Nothing starts in the next four months yet."
        render={(entry) => relativeTiming(entry.tournament, today)}
      />
      <Column
        title="Just finished"
        tone="text-text-muted"
        entries={finished}
        empty="No tournament has finished recently."
        render={(entry) =>
          entry.champion ? (
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
              <span data-spoiler="">Won by {entry.champion.winner.name}</span>
            </span>
          ) : (
            relativeTiming(entry.tournament, today)
          )
        }
      />
    </div>
  );
}
