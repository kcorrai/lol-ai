import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { POSITION_LABELS } from "@/domains/meta/positions";
import { GameLengthCurve } from "@/domains/meta/components/build/GameLengthCurve";
import type { DraftEvaluation, LaneEdge, TeamEval } from "@/domains/meta";

function DamageBar({ ad, ap }: { ad: number; ap: number }) {
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
      <div className="bg-danger" style={{ width: `${ad}%` }} title={`AD ${ad}%`} />
      <div className="bg-info" style={{ width: `${ap}%` }} title={`AP ${ap}%`} />
    </div>
  );
}

function TeamCard({ team, label, accent }: { team: TeamEval; label: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <h3 className={`mb-3 font-display text-sm font-bold uppercase tracking-wide ${accent}`}>
        {label}
      </h3>

      <div className="mb-4 flex flex-wrap gap-2">
        {team.champions.map((c) => (
          <div key={c.key} className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-2 py-1">
            <ChampionIcon name={c.key} size={22} />
            <span className="text-xs font-medium text-text">{c.name}</span>
          </div>
        ))}
      </div>

      <dl className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-text-muted">Avg win rate</dt>
          <dd className="font-bold text-text">{team.avgWinRate}%</dd>
        </div>
        <div>
          <dt className="mb-1 text-text-muted">Damage profile</dt>
          <DamageBar ad={team.adShare} ap={team.apShare} />
          <dd className="mt-1 flex justify-between text-[11px] text-text-muted">
            <span>{team.adShare}% AD</span>
            <span>{team.apShare}% AP</span>
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-text-muted">Frontline</dt>
          <dd className="font-semibold text-text">{team.frontlineScore}/100</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-text-muted">Scaling</dt>
          <dd className="font-semibold capitalize text-text">
            {team.scalingLean}
            {team.gameLengthCurve.length > 0 && (
              <span className="ml-1 text-[11px] font-normal text-text-muted">
                (from real games)
              </span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function LaneEdgeRow({ edge }: { edge: LaneEdge }) {
  const color =
    edge.favored === "blue"
      ? "text-info"
      : edge.favored === "red"
        ? "text-danger"
        : "text-text-muted";
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
      <span className="w-16 shrink-0 text-xs font-semibold text-text-muted">
        {POSITION_LABELS[edge.position]}
      </span>
      <ChampionIcon name={edge.blueKey} size={26} />
      <span className="text-xs text-text-muted">vs</span>
      <ChampionIcon name={edge.redKey} size={26} />
      <span className={`ml-auto text-xs font-medium ${color}`}>{edge.note}</span>
    </li>
  );
}

export function DraftResults({ evaluation }: { evaluation: DraftEvaluation }) {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
        <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-accent">
          Stats-based verdict
        </h2>
        <p className="text-sm text-text">{evaluation.verdict}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TeamCard team={evaluation.blue} label="Blue Team" accent="text-info" />
        <TeamCard team={evaluation.red} label="Red Team" accent="text-danger" />
      </div>

      {(evaluation.blue.gameLengthCurve.length > 0 ||
        evaluation.red.gameLengthCurve.length > 0) && (
        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-text">Win rate by game length</h2>
          <p className="mb-3 text-sm text-text-muted">
            Each team&apos;s aggregated win rate across game durations, from real ranked games.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {evaluation.blue.gameLengthCurve.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-info">
                  Blue Team
                </p>
                <GameLengthCurve points={evaluation.blue.gameLengthCurve} />
              </div>
            )}
            {evaluation.red.gameLengthCurve.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-danger">
                  Red Team
                </p>
                <GameLengthCurve points={evaluation.red.gameLengthCurve} />
              </div>
            )}
          </div>
        </div>
      )}

      {evaluation.laneEdges.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-text">Lane matchups</h2>
          <ul className="flex flex-col gap-2">
            {evaluation.laneEdges.map((edge) => (
              <LaneEdgeRow key={edge.position} edge={edge} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
