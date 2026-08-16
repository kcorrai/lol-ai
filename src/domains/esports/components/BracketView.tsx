import Link from "next/link";
import Image from "next/image";
import type { BracketLayout } from "@/domains/esports/bracket";
import type { BracketMatch, BracketTeam } from "@/domains/esports/types";

function Side({ team, decided }: { team: BracketTeam; decided: boolean }): React.ReactElement {
  const won = team.outcome === "win";

  return (
    <span
      className={`flex items-center gap-2 px-2.5 py-1.5 ${won ? "text-text" : "text-text-muted"}`}
    >
      {team.image ? (
        <Image
          src={team.image}
          alt=""
          width={18}
          height={18}
          className="h-[18px] w-[18px] shrink-0 object-contain"
          aria-hidden
          unoptimized
        />
      ) : (
        <span className="h-[18px] w-[18px] shrink-0" aria-hidden />
      )}
      <span className={`min-w-0 flex-1 truncate text-xs ${won ? "font-bold" : ""}`}>
        {team.name}
      </span>
      {decided && (
        <span className={`shrink-0 font-mono text-xs ${won ? "text-accent" : "text-text-faint"}`}>
          {team.gameWins}
        </span>
      )}
    </span>
  );
}

function Fixture({ match }: { match: BracketMatch }): React.ReactElement {
  const decided = match.teams.some((team) => team.outcome !== null);
  const known = match.teams.some((team) => team.decided);

  const body = (
    <span className="grid divide-y divide-border/60">
      {match.teams.map((team, index) => (
        <Side key={`${team.id}-${index}`} team={team} decided={decided} />
      ))}
    </span>
  );

  // A slot with no teams yet links nowhere: there is no match page to open.
  if (!known) {
    return <span className="gaming-card notch-sm block opacity-60">{body}</span>;
  }

  return (
    <Link
      href={`/esports/matches/${match.matchId}`}
      className="gaming-card notch-sm block transition-colors hover:border-line-2"
    >
      {body}
    </Link>
  );
}

/**
 * A knockout stage, round by round.
 *
 * Laid out as columns that scroll inside their own container — a bracket is
 * wider than a phone and must never widen the page around it. The rounds come
 * from `bracketLayout`, which derives them from which teams carried through,
 * because the feed publishes no wiring of its own.
 *
 * When the draw has not been made the layout says so, and the matches are listed
 * in a single column rather than drawn as a bracket that would imply an order
 * nobody has decided.
 */
export function BracketView({ layout }: { layout: BracketLayout }): React.ReactElement | null {
  if (layout.rounds.length === 0) return null;

  if (!layout.derived) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {layout.rounds[0].matches.map((match) => (
          <Fixture key={match.matchId} match={match} />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {layout.rounds.map((round) => (
          <div key={round.number} className="flex w-56 shrink-0 flex-col gap-2">
            <p className="hud-label">{round.name ?? `Round ${round.number}`}</p>
            {/* Centred against the previous column so the columns read as a
                progression even without connector lines — which cannot be drawn
                honestly, since the feed never says which match feeds which. */}
            <div className="flex flex-1 flex-col justify-around gap-2">
              {round.matches.map((match) => (
                <Fixture key={match.matchId} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
