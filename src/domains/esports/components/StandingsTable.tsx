import Image from "next/image";
import type { StandingsRow } from "@/domains/esports/types";

/**
 * A ranked table. Ranks can repeat — the feed groups tied teams under one
 * ordinal — so the rank cell marks a tie rather than pretending to an order the
 * organiser has not decided.
 */
export function StandingsTable({ rows }: { rows: StandingsRow[] }): React.ReactElement | null {
  if (rows.length === 0) return null;

  return (
    // Its own scroll container: a wide table must never widen the page itself.
    <div className="gaming-card notch overflow-x-auto">
      <table className="w-full min-w-[22rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className="hud-label px-3 py-2 font-normal">
              #
            </th>
            <th scope="col" className="hud-label px-3 py-2 font-normal">
              Team
            </th>
            <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
              W
            </th>
            <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
              L
            </th>
            <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
              Win%
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.team.id} className="border-b border-border/60 last:border-0">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-text-muted">
                {row.tied ? `T${row.rank}` : row.rank}
              </td>
              <td className="px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  {row.team.image ? (
                    <Image
                      src={row.team.image}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 shrink-0 object-contain"
                      aria-hidden
                      unoptimized
                    />
                  ) : (
                    <span className="h-5 w-5 shrink-0" aria-hidden />
                  )}
                  <span className="truncate font-display font-bold uppercase text-text">
                    {row.team.name}
                  </span>
                </span>
              </td>
              <td className="px-3 py-2 text-right font-mono text-text">{row.wins}</td>
              <td className="px-3 py-2 text-right font-mono text-text-muted">{row.losses}</td>
              <td className="px-3 py-2 text-right font-mono text-text-body">
                {row.winRate === null ? "—" : `${row.winRate}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
