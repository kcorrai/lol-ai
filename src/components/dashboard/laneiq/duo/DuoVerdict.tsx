import { HudMeter } from "@/components/dashboard/laneiq/HudPanel";
import type { DuoSynergy } from "@/domains/analysis/services/duoSynergy";

interface Props {
  synergy: DuoSynergy;
}

/** The headline: what this pairing does to the player's win rate, in one number and one line. */
export function DuoVerdict({ synergy }: Props): React.ReactElement {
  const { together, apart, synergyDelta, hasEnoughData } = synergy;

  if (!hasEnoughData) {
    return (
      <div className="border-b border-border p-5">
        <p className="hud-label">{"// Verdict"}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-text-body">
          {together.games === 0
            ? "No games together in the last 200 matches yet."
            : `${together.games} ${together.games === 1 ? "game" : "games"} together so far.`}{" "}
          <span className="text-text-muted">
            A verdict needs five — below that a single result swings the win rate far enough to
            invent one.
          </span>
        </p>
      </div>
    );
  }

  const lifted = synergyDelta !== null && synergyDelta > 0;
  const flat = synergyDelta !== null && Math.abs(synergyDelta) < 3;

  const headline =
    synergyDelta === null
      ? "No solo games to compare against"
      : flat
        ? "Neutral pairing"
        : lifted
          ? "This duo lifts you"
          : "You win more without them";

  return (
    <div className="border-b border-border p-5">
      <p className="hud-label">{"// Verdict"}</p>

      <div className="mt-2.5 flex items-baseline gap-3">
        {synergyDelta !== null && (
          <span
            className={`font-mono text-[38px] font-bold leading-none ${
              flat ? "text-text" : lifted ? "text-accent" : "text-danger"
            }`}
          >
            {synergyDelta > 0 ? "+" : ""}
            {synergyDelta}
          </span>
        )}
        <span className="text-[13px] leading-tight text-text-body">
          {headline}
          {synergyDelta !== null && (
            <span className="block font-mono text-[10.5px] uppercase tracking-label text-text-muted">
              win rate points
            </span>
          )}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        <HudMeter
          value={together.winRate ?? 0}
          label="Together"
          right={`${together.winRate ?? 0}% · ${together.games}g`}
          tone={lifted ? "accent" : "info"}
        />
        <HudMeter
          value={apart.winRate ?? 0}
          label="Alone"
          right={apart.winRate === null ? "no solo games" : `${apart.winRate}% · ${apart.games}g`}
          tone="info"
        />
      </div>
    </div>
  );
}
