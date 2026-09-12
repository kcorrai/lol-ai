interface PipsProps {
  /** How many are filled. Clamped to `total`. */
  done: number;
  total: number;
}

/**
 * A Proof of Practice counter as a row of ticks rather than "1/3".
 *
 * An assignment is measured over a handful of ranked games, so the count is always small
 * enough to show one mark per game — which reads at a glance and says, without a sentence,
 * that the thing being counted is *games played*, not percent complete.
 */
export function Pips({ done, total }: PipsProps): React.ReactElement {
  const filled = Math.max(0, Math.min(total, done));

  return (
    <span className="flex gap-[3px]" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={
            i < filled
              ? "block h-1 w-3.5 bg-accent"
              : "block h-1 w-3.5 border border-line-2 bg-surface-dark"
          }
        />
      ))}
    </span>
  );
}
