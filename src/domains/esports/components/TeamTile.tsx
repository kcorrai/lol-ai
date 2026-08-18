import Link from "next/link";
import { TeamCrest } from "@/domains/esports/components/TeamCrest";
import type { EsportsTeam } from "@/domains/esports/types";

/** One team in the index grid: crest, name, and the code its league knows it by. */
export function TeamTile({ team }: { team: EsportsTeam }): React.ReactElement {
  return (
    <Link
      href={`/esports/teams/${team.slug}`}
      className="notch-sm relative flex items-center gap-3 border border-line-1 bg-surface px-3.5 py-3 transition-colors hover:border-line-2 hover:bg-surface-2"
    >
      <TeamCrest src={team.image} code={team.code || team.name} size={30} />
      <span className="min-w-0">
        <span className="block truncate font-display text-sm font-bold uppercase tracking-[0.05em] text-text">
          {team.name}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-label text-text-faint">
          {team.code}
          {team.league ? ` · ${team.league.name}` : ""}
        </span>
      </span>
    </Link>
  );
}
