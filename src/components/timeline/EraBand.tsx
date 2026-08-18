import type { CareerBand } from "@/domains/analysis/services/careerTimeline.types";
import { TimelineEvent } from "./TimelineEvent";

function summaryLine(band: CareerBand): string | null {
  if (band.games === 0) return null;
  const parts = [`${band.games} games`, `${band.winRate}% win rate`];
  if (band.rankAtClose) parts.push(band.rankAtClose);
  if (band.lpDelta !== null && band.lpDelta !== 0) {
    parts.push(`${band.lpDelta > 0 ? "+" : ""}${band.lpDelta} LP`);
  }
  return parts.join(" · ");
}

export function EraBand({ band }: { band: CareerBand }): React.ReactElement {
  const summary = summaryLine(band);

  return (
    <section>
      <header className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
        <span className="hud-label">{`// ${band.label}`}</span>
        <span className="h-px min-w-4 flex-1 bg-line-1" />
        {summary && (
          <span className="font-mono text-[11px] text-text-muted">{summary}</span>
        )}
      </header>

      {band.events.length > 0 ? (
        <ol className="ml-[6px] mt-2 border-l border-line-1">
          {band.events.map((event) => (
            <TimelineEvent key={event.id} event={event} />
          ))}
        </ol>
      ) : (
        // A month of games that produced no milestone is still part of the career, and
        // saying so beats leaving a gap the reader has to explain to themselves.
        <p className="ml-[6px] mt-2 border-l border-line-1 py-2 pl-5 text-[12px] text-text-muted">
          Games played, nothing that changed the story.
        </p>
      )}
    </section>
  );
}
