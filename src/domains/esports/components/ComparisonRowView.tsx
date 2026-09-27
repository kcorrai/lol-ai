import { comparisonBars, type GapTone } from "@/domains/esports/comparisonBars";
import { formatMetric, type ComparisonRow } from "@/domains/esports/comparison";

const CHIP: Record<GapTone, string> = {
  ahead: "border-accent text-accent",
  behind: "border-danger text-danger",
  level: "border-border text-text-muted",
};

const YOU_BAR: Record<GapTone, string> = {
  ahead: "bg-accent",
  behind: "bg-danger",
  level: "bg-text-body",
};

function Bar({ share, className }: { share: number; className: string }): React.ReactElement {
  return (
    <span className="block h-1 bg-surface-dark">
      <span className={`block h-1 ${className}`} style={{ width: `${share * 100}%` }} />
    </span>
  );
}

/**
 * One line of "You vs the Pros": the two figures, a pair of bars that shows
 * the gap's size at a glance, and the gap as a signed percentage.
 */
export function ComparisonRowView({
  row,
  lowSample,
}: {
  row: ComparisonRow;
  lowSample: boolean;
}): React.ReactElement {
  const bars = comparisonBars(row, lowSample);

  return (
    <tr className="border-b border-border/60 align-top last:border-0">
      <th scope="row" className="px-3 py-2 text-left font-normal text-text-body">
        {row.label}
        <span className="mt-1.5 grid max-w-[14rem] gap-1" aria-hidden>
          <Bar share={bars.proShare} className="bg-text-muted" />
          <Bar share={bars.youShare} className={YOU_BAR[bars.tone]} />
        </span>
        {row.reading && <span className="mt-1 block text-xs text-text-faint">{row.reading}</span>}
      </th>
      <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-text">
        {formatMetric(row.pro, row.format)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-text">
        {formatMetric(row.you, row.format)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right">
        {bars.gapLabel && (
          <span
            className={`inline-block border px-1.5 py-0.5 font-mono text-[11px] ${CHIP[bars.tone]}`}
          >
            {bars.gapLabel}
          </span>
        )}
      </td>
    </tr>
  );
}
