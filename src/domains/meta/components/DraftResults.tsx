import { ScalingChart } from "@/domains/meta/components/ScalingChart";
import { DraftTeamPanel } from "@/domains/meta/components/draft/DraftTeamPanel";
import { DraftLaneTable } from "@/domains/meta/components/draft/DraftLaneTable";
import { laneTally } from "@/domains/meta/services/draftEvalService";
// The leaf module, not the domain barrel: this file now lives *inside* the meta domain, and a
// component importing its own domain's public API is how an import cycle starts.
import type { DraftEvaluation } from "@/domains/meta/services/draftEval.types";

/** The verdict with the two numbers it rests on: lanes won and average meta win rate. */
function DraftHeadline({ evaluation }: { evaluation: DraftEvaluation }): React.ReactElement {
  const { blue, red } = evaluation;
  const tally = laneTally(evaluation.laneEdges);
  const total = blue.avgWinRate + red.avgWinRate;
  const blueShare = total > 0 ? (blue.avgWinRate / total) * 100 : 50;

  return (
    <section className="notch-lg glow-accent-soft grid gap-6 border border-acid-500 bg-surface px-6 py-5 md:grid-cols-[1.4fr_1fr] md:items-center">
      <div>
        <h2 className="font-mono text-[10.5px] uppercase tracking-label text-acid-500">
          {"// Stats-based verdict"}
        </h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-text">{evaluation.verdict}</p>
      </div>

      <div className="grid gap-4">
        {evaluation.laneEdges.length > 0 && (
          <div className="flex items-end justify-between gap-3">
            <span className="hud-label text-[10px]">Lanes favoured</span>
            <span className="font-mono text-[28px] font-bold tabular-nums leading-none">
              <span className="text-info">{tally.blue}</span>
              <span className="px-1.5 text-text-muted">–</span>
              <span className="text-danger">{tally.red}</span>
              {tally.even > 0 && (
                <span className="ml-2 text-[11px] font-normal text-text-muted">
                  {tally.even} even
                </span>
              )}
            </span>
          </div>
        )}
        <div>
          <div className="mb-1.5 flex justify-between font-mono text-[11px] font-bold tabular-nums">
            <span className="text-info">{blue.avgWinRate}%</span>
            <span className="hud-label text-[9.5px]">Avg meta win rate</span>
            <span className="text-danger">{red.avgWinRate}%</span>
          </div>
          <div className="flex h-2 gap-0.5">
            <div className="bg-info" style={{ width: `${blueShare}%` }} />
            <div className="bg-danger" style={{ width: `${100 - blueShare}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function DraftResults({ evaluation }: { evaluation: DraftEvaluation }) {
  const names = new Map(
    [...evaluation.blue.champions, ...evaluation.red.champions].map((c) => [c.key, c.name])
  );
  const hasCurves =
    evaluation.blue.gameLengthCurve.length > 0 || evaluation.red.gameLengthCurve.length > 0;

  return (
    <div className="grid gap-6">
      <DraftHeadline evaluation={evaluation} />

      <DraftLaneTable edges={evaluation.laneEdges} names={names} />

      <div className="grid gap-5 md:grid-cols-2">
        <DraftTeamPanel team={evaluation.blue} side="blue" />
        <DraftTeamPanel team={evaluation.red} side="red" />
      </div>

      {hasCurves && (
        <section className="notch border border-border bg-surface p-5">
          <h2 className="hud-label text-[10.5px]">Win rate by game length</h2>
          <p className="mb-4 mt-1 text-xs text-text-muted">
            The average of each side&apos;s champions&apos; own win rate by game length, from real
            ranked games this patch.
          </p>
          <ScalingChart
            series={[
              { label: "Blue team", points: evaluation.blue.gameLengthCurve, tone: "info" },
              { label: "Red team", points: evaluation.red.gameLengthCurve, tone: "danger" },
            ]}
          />
        </section>
      )}
    </div>
  );
}
