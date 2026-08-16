import Link from "next/link";
import { MatchTime } from "@/domains/esports/components/MatchTime";
import type { HeadToHeadRecord } from "@/domains/esports/headToHead";

/**
 * The series these two have already played, and how they went.
 *
 * The feed publishes no head-to-head anywhere, so this is derived from the
 * completed schedule window the section already caches. That is a real limit and
 * the footnote states it: it is what these two have played inside the window,
 * not an all-time record, and claiming otherwise would be the easiest lie on
 * the page to tell.
 */
export function HeadToHead({
  record,
  aName,
  bName,
  windowLabel,
}: {
  record: HeadToHeadRecord;
  aName: string;
  bName: string;
  /** What the record is over: "the LEC's recent schedule". */
  windowLabel: string;
}): React.ReactElement | null {
  if (record.meetings.length === 0) return null;

  return (
    <div className="grid gap-3">
      <div className="gaming-card notch-sm flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 truncate font-display text-sm font-bold uppercase text-text">
          {aName}
        </p>
        <p className="shrink-0 text-center">
          <span className="font-mono text-xl font-bold text-text">
            {record.seriesWins.a}
            <span className="mx-1.5 text-text-faint">–</span>
            {record.seriesWins.b}
          </span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-label text-text-muted">
            {record.gameWins.a}–{record.gameWins.b} on games
          </span>
        </p>
        <p className="min-w-0 flex-1 truncate text-right font-display text-sm font-bold uppercase text-text">
          {bName}
        </p>
      </div>

      <ul className="grid gap-1.5">
        {record.meetings.map((entry) => (
          <li key={entry.matchId}>
            <Link
              href={`/esports/matches/${entry.matchId}`}
              className="gaming-card notch-sm flex flex-wrap items-center gap-3 px-4 py-2.5 transition-colors hover:border-accent"
            >
              <MatchTime startTime={entry.startTime} withDate className="hud-label shrink-0" />
              <span className="hud-label min-w-0 flex-1 truncate">
                {entry.blockName ?? ""}
                {entry.bestOf ? `${entry.blockName ? " · " : ""}Bo${entry.bestOf}` : ""}
              </span>
              <span className="shrink-0 font-mono text-sm text-text">
                <span className={entry.winner === "a" ? "text-accent" : "text-text-muted"}>
                  {entry.score.a}
                </span>
                <span className="mx-1 text-text-faint">–</span>
                <span className={entry.winner === "b" ? "text-accent" : "text-text-muted"}>
                  {entry.score.b}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-text-muted">
        Over {windowLabel}. Riot publishes no head-to-head record, so this counts the meetings in
        the schedule window rather than an all-time series.
      </p>
    </div>
  );
}
