import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ROLE_LABEL } from "@/domains/esports/roles";
import { sortChampions, type ProMetaSort } from "@/domains/esports/proMetaSort";
import type { ProChampionStat } from "@/domains/esports/types";

function RoleSplit({ champion }: { champion: ProChampionStat }): React.ReactElement {
  if (!champion.topRole) return <span className="text-text-faint">—</span>;

  const inTopRole = champion.roles[champion.topRole] ?? 0;
  const flex = champion.picks > inTopRole;

  return (
    <span className="whitespace-nowrap">
      {ROLE_LABEL[champion.topRole]}
      {/* A champion played in more than one role is worth saying out loud —
          it is the difference between a lane pick and a flex pick. */}
      {flex && <span className="ml-1 text-text-faint">+flex</span>}
    </span>
  );
}

export function ProMetaTable({
  champions,
  sort,
}: {
  champions: ProChampionStat[];
  sort: ProMetaSort;
}): React.ReactElement | null {
  const rows = sortChampions(champions, sort);
  if (rows.length === 0) return null;

  return (
    <div className="gaming-card notch overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="hud-label px-3 py-2 font-normal">
              Champion
            </th>
            <th scope="col" className="hud-label px-3 py-2 font-normal">
              Role
            </th>
            <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
              Picks
            </th>
            <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
              Pick%
            </th>
            <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
              W–L
            </th>
            <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
              Win%
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((champion) => (
            <tr key={champion.championId} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <ChampionIcon name={champion.championId} size={24} />
                  {/* The Data Dragon id verbatim, which is the slug convention
                      both clusters share (ADR-017 §2) — so this link, and the
                      `/builds` link on the page it opens, are mechanical. */}
                  <Link
                    href={`/esports/champions/${champion.championId}`}
                    className="truncate font-display font-bold uppercase text-text hover:text-accent"
                  >
                    {champion.championId}
                  </Link>
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-[11px] uppercase tracking-label text-text-muted">
                <RoleSplit champion={champion} />
              </td>
              <td className="px-3 py-2 text-right font-mono text-text">{champion.picks}</td>
              <td className="px-3 py-2 text-right font-mono text-text-body">
                {champion.pickRate.toFixed(0)}%
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-text-muted">
                {champion.wins}–{champion.decidedGames - champion.wins}
              </td>
              <td className="px-3 py-2 text-right font-mono text-text-body">
                {champion.winRate === null ? "—" : `${champion.winRate.toFixed(0)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
