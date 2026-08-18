import Link from "next/link";
import { MatchTime } from "@/domains/esports/components/MatchTime";
import { TeamCrest } from "@/domains/esports/components/TeamCrest";
import type { EsportsEvent, EsportsEventTeam, HeadToHeadRecord } from "@/domains/esports";

interface NextMatchCardProps {
  event: EsportsEvent;
  /** The team whose page this is, so the card can name the opponent. */
  teamCode: string;
  /** Recent meetings between the two, or null when they have none on record. */
  headToHead: HeadToHeadRecord | null;
}

function Side({
  side,
  align,
}: {
  side: EsportsEventTeam | undefined;
  align: "left" | "right";
}): React.ReactElement {
  return (
    <span
      className={`flex min-w-0 items-center gap-3.5 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamCrest src={side?.image ?? null} code={side?.code ?? "TBD"} size={44} />
      <span className="min-w-0">
        <span className="block truncate font-display text-2xl font-extrabold uppercase tracking-[0.05em] text-text">
          {side?.code || side?.name || "TBD"}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-label text-text-faint">
          {side?.name ?? "To be decided"}
          {side?.record ? ` · ${side.record.wins}W ${side.record.losses}L` : ""}
        </span>
      </span>
    </span>
  );
}

/**
 * The next series, at the size of the thing people came for.
 *
 * A fan opening a team page mid-split wants one fact before any other, and the
 * same row that serves a list of ten fixtures answers it too quietly. The
 * head-to-head line under it is what turns the fixture into a reason to watch.
 */
export function NextMatchCard({
  event,
  teamCode,
  headToHead,
}: NextMatchCardProps): React.ReactElement {
  const [home, away] = event.teams;
  const homeIsSubject = home?.code.toLowerCase() === teamCode.toLowerCase();
  const record = headToHead
    ? homeIsSubject
      ? headToHead.seriesWins
      : { a: headToHead.seriesWins.b, b: headToHead.seriesWins.a }
    : null;

  return (
    <section className="notch glow-accent-soft bg-hero-fade border border-accent bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-line-1 px-5 py-3">
        <h2 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">
          {"// Next match"}
        </h2>
        <MatchTime
          startTime={event.startTime}
          withDate
          className="text-right font-mono text-[10.5px] uppercase tracking-label text-text-muted"
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-5 py-6">
        <Side side={home} align="left" />
        <span className="text-center">
          <span className="block font-mono text-[11px] uppercase tracking-[0.2em] text-text-faint">
            {event.bestOf ? `Bo${event.bestOf}` : "Series"}
          </span>
          <span className="mt-1.5 block font-display text-sm font-extrabold tracking-[0.1em] text-text-muted">
            VS
          </span>
        </span>
        <Side side={away} align="right" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line-1 px-5 py-3">
        <span className="font-mono text-[10.5px] tracking-[0.1em] text-text-muted">
          {record && headToHead && headToHead.meetings.length > 0 ? (
            <>
              Recent meetings ·{" "}
              <span className="text-text">
                {home?.code ?? "?"} {record.a} – {record.b} {away?.code ?? "?"}
              </span>
            </>
          ) : (
            "No recent meeting on record"
          )}
        </span>
        <Link
          href={`/esports/matches/${event.matchId}`}
          className="shrink-0 font-mono text-[10.5px] uppercase tracking-label text-accent hover:underline"
        >
          Match page →
        </Link>
      </div>
    </section>
  );
}
