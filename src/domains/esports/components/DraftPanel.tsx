import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { GameTeamStats } from "@/domains/esports/types";

const ROLE_LABEL: Record<string, string> = {
  top: "Top",
  jungle: "Jng",
  mid: "Mid",
  bottom: "Bot",
  support: "Sup",
};

function SidePicks({ team, label }: { team: GameTeamStats; label: string }): React.ReactElement {
  return (
    <div>
      <p className="hud-label mb-2">
        {label}
        <span className={`ml-2 ${team.side === "blue" ? "text-accent-blue" : "text-danger"}`}>
          {team.side}
        </span>
      </p>
      <ul className="grid gap-1.5">
        {team.participants.map((participant) => (
          <li key={participant.participantId} className="flex items-center gap-2">
            <ChampionIcon name={participant.championId} size={28} />
            <span className="min-w-0">
              <Link
                href={`/champions/${participant.championId}`}
                className="block truncate text-sm text-text hover:text-accent"
              >
                {participant.championId}
              </Link>
              <span className="block truncate font-mono text-[11px] text-text-faint">
                {participant.role ? `${ROLE_LABEL[participant.role]} · ` : ""}
                {participant.handle}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Both sides' picks.
 *
 * Bans are not shown: the livestats feed publishes the ten champions that were
 * played and nothing about what was banned, so a bans row would be a row of
 * blanks. Draft *order* is likewise not published — these are the picks, in
 * lane order.
 */
export function DraftPanel({
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
    <div className="gaming-card notch grid gap-6 px-4 py-4 sm:grid-cols-2">
      <SidePicks team={blue} label={blueName} />
      <SidePicks team={red} label={redName} />
    </div>
  );
}
