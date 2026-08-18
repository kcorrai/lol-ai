import { RosterCard } from "@/domains/esports/components/RosterCard";
import { ROLE_LABEL } from "@/domains/esports/roles";
import type { EsportsPlayer, PlayerRole } from "@/domains/esports/types";

/** Draft order, top to support — the order a roster is read out in. */
const LANES: PlayerRole[] = ["top", "jungle", "mid", "bottom", "support"];

interface TeamRosterProps {
  players: EsportsPlayer[];
  /** Player id → their page, for the players the index could slug. */
  hrefs: Map<string, string>;
}

function Group({
  title,
  players,
  hrefs,
}: {
  title: string;
  players: EsportsPlayer[];
  hrefs: Map<string, string>;
}): React.ReactElement {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2.5">
        <h3 className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-accent">{title}</h3>
        <span className="h-px flex-1 bg-line-1" aria-hidden />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {players.map((player) => (
          <RosterCard key={player.id} player={player} href={hrefs.get(player.id)} />
        ))}
      </div>
    </div>
  );
}

/**
 * The roster, by lane.
 *
 * Grouped rather than listed because a roster with four bot laners on it is the
 * normal case for an academy-fed org, and an ungrouped grid of nine names makes
 * the reader work out which five of them play together.
 */
export function TeamRoster({ players, hrefs }: TeamRosterProps): React.ReactElement | null {
  if (players.length === 0) return null;

  const lanes = LANES.map((lane) => ({
    lane,
    players: players.filter((player) => player.role === lane),
  })).filter((group) => group.players.length > 0);

  const others = players.filter((player) => player.role === null);

  return (
    <div className="grid gap-4">
      {lanes.map((group) => (
        <Group
          key={group.lane}
          title={ROLE_LABEL[group.lane]}
          players={group.players}
          hrefs={hrefs}
        />
      ))}
      {others.length > 0 && <Group title="Substitutes & staff" players={others} hrefs={hrefs} />}
    </div>
  );
}
