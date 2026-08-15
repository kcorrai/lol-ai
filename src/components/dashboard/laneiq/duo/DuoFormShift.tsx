import type { PlayerAverages } from "@/domains/analysis/services/duoSynergy";

interface Props {
  together: PlayerAverages | null;
  apart: PlayerAverages | null;
}

interface Row {
  label: string;
  pick: (a: PlayerAverages) => number;
  /** Whether a higher number is the better one, which decides the colour. */
  higherIsBetter: boolean;
  decimals: number;
}

const ROWS: readonly Row[] = [
  { label: "KDA", pick: (a) => a.kda, higherIsBetter: true, decimals: 2 },
  { label: "Deaths", pick: (a) => a.deaths, higherIsBetter: false, decimals: 1 },
  { label: "Vision", pick: (a) => a.visionScore, higherIsBetter: true, decimals: 1 },
  { label: "CS / min", pick: (a) => a.csPerMinute, higherIsBetter: true, decimals: 1 },
];

/**
 * How the player's own game changes when this partner is in it.
 *
 * Deliberately about the player, not the pair: "we won more" is the verdict above, and this
 * answers *why* — a support duo that halves your CS is a different problem from one that gets
 * you killed.
 */
export function DuoFormShift({ together, apart }: Props): React.ReactElement | null {
  if (!together || !apart) return null;

  return (
    <div className="border-b border-border p-5">
      <p className="hud-label mb-3">{"// Your game with them"}</p>

      <dl className="space-y-2">
        {ROWS.map((row) => {
          const withThem = row.pick(together);
          const without = row.pick(apart);
          const diff = withThem - without;
          const better = row.higherIsBetter ? diff > 0 : diff < 0;
          // Sub-decimal moves are rounding, not a finding.
          const meaningful = Math.abs(diff) >= 0.1;

          return (
            <div key={row.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-[13px] text-text-body">{row.label}</dt>
              <dd className="flex items-baseline gap-2 font-mono text-[11.5px]">
                <span className="text-text">{withThem.toFixed(row.decimals)}</span>
                <span className="text-text-muted">was {without.toFixed(row.decimals)}</span>
                <span
                  className={
                    !meaningful ? "text-text-muted" : better ? "text-accent" : "text-danger"
                  }
                >
                  {diff > 0 ? "+" : ""}
                  {diff.toFixed(row.decimals)}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
