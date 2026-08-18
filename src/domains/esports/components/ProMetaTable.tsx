import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ROLE_SHORT } from "@/domains/esports/roles";
import { sortChampions, type ProMetaSort } from "@/domains/esports/proMetaSort";
import type { ProChampionStat } from "@/domains/esports/types";

// Not sticky, deliberately: the panel below scrolls horizontally, and an
// `overflow-x` scroller is the scrollport its own sticky children resolve
// against — so a header offset for the page header lands that far *down* the
// table instead, on top of the first row.
const HEAD = "hud-label border-b border-line-2 bg-surface-2 px-3 py-2.5 font-normal";

function RoleSplit({ champion }: { champion: ProChampionStat }): React.ReactElement {
  if (!champion.topRole) return <span className="text-text-faint">—</span>;

  const inTopRole = champion.roles[champion.topRole] ?? 0;
  const flex = champion.picks > inTopRole;

  return (
    <span className="whitespace-nowrap">
      {ROLE_SHORT[champion.topRole]}
      {/* A champion played in more than one role is worth saying out loud —
          it is the difference between a lane pick and a flex pick. */}
      {flex && <span className="ml-1 text-text-faint">+flex</span>}
    </span>
  );
}

/** A bar behind a figure, so a column of numbers has a shape as well as a value. */
function Meter({ percent, tone }: { percent: number; tone: string }): React.ReactElement {
  return (
    <span className="h-1 flex-1 bg-surface-dark" aria-hidden>
      <span
        className={`block h-1 ${tone}`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
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

  // Pick rate is scaled against the table's own leader rather than against 100:
  // in a sample where nothing clears 36%, bars drawn against 100 are all stubs
  // and the column stops distinguishing anything.
  const peakPickRate = Math.max(...rows.map((row) => row.pickRate), 1);

  return (
    <div className="notch overflow-x-auto border border-border bg-surface">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <thead>
          <tr className="text-left">
            <th scope="col" className={`${HEAD} w-12 text-right`}>
              #
            </th>
            <th scope="col" className={HEAD}>
              Champion
            </th>
            <th scope="col" className={HEAD}>
              Role
            </th>
            <th scope="col" className={`${HEAD} text-right`}>
              Picks
            </th>
            <th scope="col" className={`${HEAD} w-40`}>
              Pick rate
            </th>
            <th scope="col" className={`${HEAD} text-center`}>
              W–L
            </th>
            <th scope="col" className={`${HEAD} w-32 text-right`}>
              Win
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((champion, index) => {
            const strong = champion.winRate !== null && champion.winRate >= 60;
            const weak = champion.winRate !== null && champion.winRate < 40;
            const rail = strong
              ? "border-l-accent"
              : weak
                ? "border-l-danger/45"
                : "border-l-transparent";

            return (
              <tr
                key={champion.championId}
                className="border-b border-line-1 transition-colors last:border-0 hover:bg-surface-2"
              >
                <td
                  className={`border-l-2 px-3 py-2 text-right font-mono text-xs text-text-faint ${rail}`}
                >
                  {String(index + 1).padStart(2, "0")}
                </td>
                <td className="px-3 py-2">
                  <span className="flex min-w-0 items-center gap-3">
                    <ChampionIcon name={champion.championId} size={28} />
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
                <td className="px-3 py-2 font-mono text-[10px] uppercase tracking-label text-text-muted">
                  <RoleSplit champion={champion} />
                </td>
                <td className="px-3 py-2 text-right font-mono text-text">{champion.picks}</td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2.5">
                    <Meter percent={(champion.pickRate / peakPickRate) * 100} tone="bg-ink-400" />
                    <span className="w-9 shrink-0 text-right font-mono text-xs text-text-body">
                      {champion.pickRate.toFixed(0)}%
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-center font-mono text-[12.5px] text-text-muted">
                  {champion.wins}–{champion.decidedGames - champion.wins}
                </td>
                <td className="px-3 py-2">
                  <span className="flex items-center justify-end gap-2.5">
                    <Meter
                      percent={champion.winRate ?? 0}
                      tone={strong ? "bg-accent" : weak ? "bg-danger" : "bg-info"}
                    />
                    <span
                      className={`w-11 shrink-0 text-right font-mono text-[13px] font-bold ${
                        strong ? "text-accent" : weak ? "text-danger" : "text-text"
                      }`}
                    >
                      {champion.winRate === null ? "—" : `${champion.winRate.toFixed(0)}%`}
                    </span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
