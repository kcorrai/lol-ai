import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { HudMeter } from "@/components/dashboard/laneiq/HudPanel";
import type { TeamEval } from "@/domains/meta/services/draftEval.types";

const SCALING_LABEL: Record<TeamEval["scalingLean"], string> = {
  early: "Early game",
  balanced: "Balanced",
  late: "Late game",
};

/** One side's composition read: picks, meta strength, damage split, frontline, engage, scaling. */
export function DraftTeamPanel({
  team,
  side,
}: {
  team: TeamEval;
  side: "blue" | "red";
}): React.ReactElement {
  const blue = side === "blue";
  return (
    <section
      className={`notch border border-l-2 border-border bg-surface p-5 ${blue ? "border-l-info" : "border-l-danger"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={`font-mono text-[11px] font-bold uppercase tracking-label ${blue ? "text-info" : "text-danger"}`}
        >
          {blue ? "Blue team" : "Red team"}
        </h3>
        <div className="text-right">
          <p className="font-mono text-[22px] font-bold tabular-nums leading-none text-text">
            {team.avgWinRate}%
          </p>
          <p className="hud-label mt-1 text-[9.5px]">Avg win rate</p>
        </div>
      </div>

      <ul className="mt-3 flex gap-1.5" aria-label={`${blue ? "Blue" : "Red"} picks`}>
        {team.champions.map((c) => (
          <li key={c.key} title={c.name}>
            <ChampionIcon name={c.key} size={34} />
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-3.5">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[13px] text-text-body">Damage</span>
            <span className="font-mono text-[11px] text-text-muted">
              <span className="text-danger">{team.adShare}% AD</span> ·{" "}
              <span className="text-info">{team.apShare}% AP</span>
            </span>
          </div>
          <div className="flex h-1.5 gap-0.5">
            <div className="bg-danger" style={{ width: `${team.adShare}%` }} />
            <div className="bg-info" style={{ width: `${team.apShare}%` }} />
          </div>
        </div>
        <HudMeter
          label="Frontline"
          right={`${team.frontlineScore}/100`}
          value={team.frontlineScore}
        />
        <HudMeter
          label="Engage"
          right={`${team.engageScore}/100`}
          value={team.engageScore}
          tone="info"
        />
        <div className="flex items-baseline justify-between border-t border-line-1 pt-3">
          <span className="text-[13px] text-text-body">Scaling</span>
          <span className="font-mono text-[11.5px] uppercase tracking-label text-text">
            {SCALING_LABEL[team.scalingLean]}
            {team.gameLengthCurve.length > 0 && (
              <span className="ml-1.5 normal-case tracking-normal text-text-muted">
                · from real games
              </span>
            )}
          </span>
        </div>
      </div>
    </section>
  );
}
