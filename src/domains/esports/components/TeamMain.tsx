import Link from "next/link";
import { HudHeading } from "@/domains/esports/components/HudHeading";
import { NextMatchCard } from "@/domains/esports/components/NextMatchCard";
import { SeriesRow } from "@/domains/esports/components/SeriesRow";
import { TeamRoster } from "@/domains/esports/components/TeamRoster";
import type { HeadToHeadRecord } from "@/domains/esports/headToHead";
import type { EsportsEvent, EsportsTeam, MatchOutcome } from "@/domains/esports/types";

interface TeamMainProps {
  team: EsportsTeam;
  /** Fixtures, soonest first. The first one gets the hero card. */
  upcoming: EsportsEvent[];
  results: EsportsEvent[];
  /** Player id → their page, for the players the index could slug. */
  playerHref: Map<string, string>;
  /** Recent meetings with the next opponent, or null when there are none. */
  meetings: HeadToHeadRecord | null;
}

/** How the subject team came out of a finished series. */
function outcomeFor(team: EsportsTeam, event: EsportsEvent): MatchOutcome | null {
  const side = event.teams.find(
    (entry) =>
      entry.code.toLowerCase() === team.code.toLowerCase() ||
      entry.name.toLowerCase() === team.name.toLowerCase()
  );
  return side?.outcome ?? null;
}

function Panel({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="notch overflow-hidden border border-border bg-surface">{children}</div>;
}

/**
 * The column a team page is mostly made of: next match, roster, results.
 *
 * In that order because it is the order the questions get asked in — when do
 * they play, who is playing, and how have they been going.
 */
export function TeamMain({
  team,
  upcoming,
  results,
  playerHref,
  meetings,
}: TeamMainProps): React.ReactElement {
  const [next, ...later] = upcoming;
  const empty = team.players.length === 0 && upcoming.length === 0 && results.length === 0;

  return (
    <div className="grid min-w-0 gap-8">
      {next && <NextMatchCard event={next} teamCode={team.code} headToHead={meetings} />}

      {later.length > 0 && (
        <section>
          <HudHeading>Also scheduled</HudHeading>
          <Panel>
            {later.map((event) => (
              <SeriesRow
                key={event.matchId}
                event={event}
                href={`/esports/matches/${event.matchId}`}
                showLeague={false}
                withDate
              />
            ))}
          </Panel>
        </section>
      )}

      {team.players.length > 0 && (
        <section>
          <HudHeading
            action={
              <span className="hud-label shrink-0">
                {team.players.length} players · lanes marked
              </span>
            }
          >
            Roster
          </HudHeading>
          <TeamRoster players={team.players} hrefs={playerHref} />
        </section>
      )}

      {results.length > 0 && (
        <section>
          <HudHeading
            action={
              <Link
                href="/esports/vods"
                className="shrink-0 font-mono text-[10.5px] uppercase tracking-label text-accent hover:underline"
              >
                VOD archive →
              </Link>
            }
          >
            Recent results
          </HudHeading>
          <Panel>
            {results.map((event) => (
              <SeriesRow
                key={event.matchId}
                event={event}
                href={`/esports/matches/${event.matchId}`}
                showLeague={false}
                withDate
                outcome={outcomeFor(team, event)}
              />
            ))}
          </Panel>
        </section>
      )}

      {empty && (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
          Riot publishes no roster or recent matches for this team. If it is competing again, this
          page fills in on its own.
        </p>
      )}
    </div>
  );
}
