import Link from "next/link";
import { TeamCrest } from "@/domains/esports/components/TeamCrest";
import type { StandingsRow } from "@/domains/esports/types";

interface StandingsRailProps {
  rows: StandingsRow[];
  /** The team whose page this is, marked out of the table. */
  highlightId: string;
  leagueName: string;
  /** Where "Full →" goes, or undefined when the league has no page resolved. */
  fullHref?: string;
}

/**
 * The league table, narrow enough to sit beside the page rather than under it.
 *
 * Not `StandingsTable`: that one is the league page's own table with a win-rate
 * column, and in a 300px rail its columns collapse into each other. Here the
 * only question is where this team sits, so the row it belongs to is the one
 * that is styled and the rest are context.
 */
export function StandingsRail({
  rows,
  highlightId,
  leagueName,
  fullHref,
}: StandingsRailProps): React.ReactElement | null {
  if (rows.length === 0) return null;

  return (
    <section className="notch border border-border bg-surface">
      <div className="flex items-center justify-between gap-2.5 border-b border-line-1 px-4 py-3">
        <h2 className="hud-label truncate">{`// ${leagueName} standings`}</h2>
        {fullHref && (
          <Link
            href={fullHref}
            className="shrink-0 font-mono text-[9.5px] uppercase tracking-label text-accent hover:underline"
          >
            Full →
          </Link>
        )}
      </div>
      <ol>
        {rows.map((row) => {
          const self = row.team.id === highlightId;
          return (
            <li
              key={row.team.id}
              className={`grid grid-cols-[1.5rem_1.375rem_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-l-2 border-b-line-1 px-4 py-2.5 last:border-b-0 ${
                self ? "border-l-accent bg-[var(--surface-accent)]" : "border-l-transparent"
              }`}
            >
              <span className="font-mono text-[11px] text-text-faint">
                {row.tied ? `T${row.rank}` : row.rank}
              </span>
              <TeamCrest src={row.team.image} code={row.team.code || row.team.name} size={22} />
              {row.team.slug && !self ? (
                <Link
                  href={`/esports/teams/${row.team.slug}`}
                  className="truncate font-display text-[13px] font-bold uppercase tracking-[0.05em] text-text hover:text-accent"
                >
                  {row.team.code || row.team.name}
                </Link>
              ) : (
                <span
                  className={`truncate font-display text-[13px] font-bold uppercase tracking-[0.05em] ${
                    self ? "text-accent" : "text-text"
                  }`}
                >
                  {row.team.code || row.team.name}
                </span>
              )}
              <span className="font-mono text-xs text-text-body">
                {row.wins}–{row.losses}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
