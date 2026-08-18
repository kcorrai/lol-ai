import Link from "next/link";
import { TeamCrest } from "@/domains/esports/components/TeamCrest";
import type { EsportsEvent } from "@/domains/esports/types";

function LiveCard({ event }: { event: EsportsEvent }): React.ReactElement {
  const [home, away] = event.teams;

  return (
    <Link
      href={`/esports/matches/${event.matchId}`}
      className="notch block border border-danger bg-surface shadow-[0_0_26px_rgba(255,90,90,0.10)] transition-colors hover:bg-surface-2"
    >
      <span className="flex items-center justify-between gap-3 border-b border-line-1 bg-surface-2 px-4 py-2.5">
        <span className="truncate font-mono text-[10px] uppercase tracking-label text-text-body">
          {event.league.name}
          {event.blockName ? ` · ${event.blockName}` : ""}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-label text-danger">
          <span className="h-1.5 w-1.5 bg-danger motion-safe:animate-pulse" aria-hidden />
          Live
        </span>
      </span>

      <span className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3.5 px-4 py-4">
        <span className="flex min-w-0 items-center gap-3">
          <TeamCrest src={home?.image ?? null} code={home?.code ?? "TBD"} size={32} />
          <span className="truncate font-display text-[17px] font-extrabold uppercase tracking-[0.05em] text-text">
            {home?.code || home?.name || "TBD"}
          </span>
        </span>
        <span className="text-center">
          <span className="block font-mono text-2xl font-bold leading-none text-text">
            {home?.gameWins ?? 0}
            <span className="mx-1.5 text-text-faint">–</span>
            {away?.gameWins ?? 0}
          </span>
          <span className="mt-1.5 block font-mono text-[9px] uppercase tracking-label text-text-faint">
            {event.bestOf ? `Bo${event.bestOf}` : "Series"}
          </span>
        </span>
        <span className="flex min-w-0 flex-row-reverse items-center gap-3">
          <TeamCrest src={away?.image ?? null} code={away?.code ?? "TBD"} size={32} />
          <span className="truncate text-right font-display text-[17px] font-extrabold uppercase tracking-[0.05em] text-text">
            {away?.code || away?.name || "TBD"}
          </span>
        </span>
      </span>

      <span className="flex items-center justify-between gap-3 border-t border-line-1 px-4 py-2.5">
        <span className="truncate font-mono text-[10.5px] tracking-[0.1em] text-text-muted">
          {event.streams.length > 0
            ? `${event.streams.length} ${event.streams.length === 1 ? "stream" : "streams"} live`
            : "In progress"}
        </span>
        <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-label text-accent">
          Watch →
        </span>
      </span>
    </Link>
  );
}

/**
 * What is happening right now, above everything else on the page.
 *
 * Full-bleed rather than in the page column: a live band that shares a gutter
 * with the fixture list reads as one more section of it, and a reader arriving
 * mid-series should not have to find the thing they came for.
 */
export function LiveSeriesBar({ events }: { events: EsportsEvent[] }): React.ReactElement | null {
  if (events.length === 0) return null;

  return (
    <section className="bg-scanline border-b border-border bg-surface-dark">
      <div className="mx-auto max-w-[1240px] px-5 py-5 md:px-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-[7px] w-[7px] bg-danger motion-safe:animate-pulse" aria-hidden />
          <h2 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-text">
            Live right now
          </h2>
          <span className="h-px flex-1 bg-line-1" aria-hidden />
          <span className="hud-label">{events.length} in progress</span>
        </div>
        {/* One series takes the full width rather than half of a two-up grid: a
            lone card floating in the left half reads as a layout that failed to
            load its neighbour. */}
        <div className={`grid gap-3 ${events.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {events.map((event) => (
            <LiveCard key={event.matchId} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
