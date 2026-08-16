import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { FinalStatLine, GameParticipant, GameTeamStats } from "@/domains/esports/types";

/**
 * What each side finished the game holding.
 *
 * The scoreboard answers what a player *did*; this answers what they had while
 * doing it — the 482 armour on a full-tank Malphite, the 995 ability power on a
 * mid laner who was allowed to scale. The details feed has published it all
 * along and nothing read it.
 */

interface Column {
  key: keyof FinalStatLine;
  label: string;
  /** Rendered with a trailing % — the feed publishes these as percentages. */
  percent?: boolean;
}

const COLUMNS: Column[] = [
  { key: "attackDamage", label: "AD" },
  { key: "abilityPower", label: "AP" },
  { key: "armor", label: "Armor" },
  { key: "magicResistance", label: "MR" },
  // Relative to the champion's base, which is how the feed publishes it.
  { key: "attackSpeed", label: "AS", percent: true },
  { key: "lifeSteal", label: "Life steal", percent: true },
];

function cell(stats: FinalStatLine, column: Column): string {
  const value = stats[column.key];
  // A real zero, not a gap: a tank genuinely ends on no ability power. Dimming
  // it in the markup would be a lie about the data, so it is dimmed in CSS by
  // the row, not replaced with a dash.
  return column.percent ? `${Math.round(value)}%` : String(Math.round(value));
}

function SideSheet({ team, name }: { team: GameTeamStats; name: string }): React.ReactElement {
  return (
    <div>
      <p className="mb-2 font-display text-sm font-bold uppercase text-text">
        {name}
        <span
          className={`ml-2 font-mono text-[11px] uppercase ${
            team.side === "blue" ? "text-accent-blue" : "text-danger"
          }`}
        >
          {team.side}
        </span>
      </p>

      <div className="gaming-card notch-sm overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="hud-label px-2 py-2 font-normal">
                Player
              </th>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="hud-label px-2 py-2 text-right font-normal"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.participants.map((participant) => (
              <StatRow key={participant.participantId} participant={participant} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatRow({ participant }: { participant: GameParticipant }): React.ReactElement {
  const stats = participant.finalStats;

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-2 py-2">
        <span className="flex min-w-0 items-center gap-2">
          <ChampionIcon name={participant.championId} size={22} />
          <span className="min-w-0 truncate font-display text-[13px] font-bold uppercase text-text">
            {participant.handle}
          </span>
        </span>
      </td>
      {COLUMNS.map((column) => (
        <td
          key={column.key}
          className={`px-2 py-2 text-right font-mono ${
            stats && stats[column.key] > 0 ? "text-text-body" : "text-text-faint"
          }`}
        >
          {stats ? cell(stats, column) : "—"}
        </td>
      ))}
    </tr>
  );
}

/**
 * Whether this game has a stat sheet worth a heading.
 *
 * A game the details feed published nothing for already shows a scoreboard built
 * from the window alone; a table of dashes under it, with a "Final stats"
 * heading over it, would be worse than no section. The caller asks first.
 */
export function hasFinalStats(blue: GameTeamStats, red: GameTeamStats): boolean {
  return [...blue.participants, ...red.participants].some(
    (participant) => participant.finalStats !== null
  );
}

/** Final stat lines for both sides. */
export function StatSheet({
  blue,
  red,
  blueName,
  redName,
}: {
  blue: GameTeamStats;
  red: GameTeamStats;
  blueName: string;
  redName: string;
}): React.ReactElement {
  return (
    <div className="grid gap-6">
      <SideSheet team={blue} name={blueName} />
      <SideSheet team={red} name={redName} />
    </div>
  );
}
