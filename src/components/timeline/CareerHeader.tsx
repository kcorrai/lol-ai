import { StatBlock } from "@/components/dashboard/laneiq/HudPanel";
import type { CareerSummary, LpPoint } from "@/domains/analysis/services/careerTimeline.types";
import { LpSparkline } from "./LpSparkline";

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CareerHeader({
  summary,
  lpSeries,
}: {
  summary: CareerSummary;
  lpSeries: LpPoint[];
}): React.ReactElement {
  return (
    <section className="notch border border-border bg-surface">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line-1 px-5 py-3.5">
        <h1 className="font-display text-lg font-bold text-text">
          {summary.gameName}
          <span className="text-text-muted">#{summary.tagLine}</span>
        </h1>
        <span className="font-mono text-[11.5px] text-text-muted">
          Level {summary.summonerLevel}
        </span>
        {/* Said plainly and up front. Riot serves about two years of matches and no past
            seasons at all, so this is where the record starts — not where the player did. */}
        <span className="ml-auto font-mono text-[11.5px] text-text-muted">
          Tracking since {shortDate(summary.firstTrackedAt)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-line-1 md:grid-cols-4">
        <div className="bg-surface px-5 py-3.5">
          <StatBlock label="Games tracked" value={String(summary.totalGames)} />
        </div>
        <div className="bg-surface px-5 py-3.5">
          <StatBlock label="Hours on the rift" value={String(summary.totalHours)} unit="h" />
        </div>
        <div className="bg-surface px-5 py-3.5">
          <StatBlock label="Rank now" value={summary.currentRank ?? "Unranked"} />
        </div>
        <div className="bg-surface px-5 py-3.5">
          <StatBlock label="Peak" value={summary.peakRank ?? "—"} />
        </div>
      </div>

      {lpSeries.length >= 2 && (
        <div className="border-t border-line-1 px-5 py-3.5">
          <span className="hud-label">{"// The climb"}</span>
          <div className="mt-2">
            <LpSparkline points={lpSeries} />
          </div>
        </div>
      )}

      {summary.topMastery.length > 0 && (
        <div className="border-t border-line-1 px-5 py-3.5">
          <div className="flex items-baseline gap-3">
            <span className="hud-label">{"// All-time mastery"}</span>
            <span className="text-[11.5px] text-text-muted">
              Counted since the account was made, not since we started watching
            </span>
          </div>
          <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
            {summary.topMastery.map((m) => (
              <li key={m.championId} className="flex items-baseline gap-1.5">
                <span className="text-[13px] text-text">{m.championName}</span>
                <span className="font-mono text-[11px] text-accent">M{m.level}</span>
                <span className="font-mono text-[11px] text-text-muted">
                  {m.points.toLocaleString("en-GB")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
