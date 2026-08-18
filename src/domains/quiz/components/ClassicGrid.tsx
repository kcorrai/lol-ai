"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { CLASSIC_COLUMNS, type ClassicRow, type GuessResult } from "@/domains/quiz";

interface ClassicGridProps {
  results: GuessResult[];
}

// Solid fill on a hit rather than a tint: the whole grid is read at a glance and
// the matches have to be the loudest thing in it. Amber and the year arrows are
// the only other information the cells carry — the legend lives in the rail.
const CELL_TONE: Record<string, string> = {
  exact: "glow-accent-soft border-accent bg-accent text-ink-1000",
  partial: "border-warning bg-warning/20 text-warning",
  none: "border-line-2 bg-surface-dark text-fg-3",
};

function Cell({
  row,
  column,
  delayMs,
}: {
  row: ClassicRow;
  column: (typeof CLASSIC_COLUMNS)[number];
  delayMs: number;
}): React.JSX.Element {
  const cell = row[column.key];
  const isYear = column.key === "releaseYear";
  const hint = isYear
    ? row.releaseYear.hint === "higher"
      ? "▲"
      : row.releaseYear.hint === "lower"
        ? "▼"
        : ""
    : "";

  return (
    <td className="p-0.5">
      <div
        className={`tag-cut flex h-full min-h-[46px] animate-quiz-flip items-center justify-center gap-1 border px-1.5 py-1 text-center font-mono text-[10.5px] uppercase leading-tight tracking-wide [transform-origin:top_center] ${CELL_TONE[cell.match]}`}
        style={{ animationDelay: `${delayMs}ms` }}
        title={cell.value}
      >
        <span className="line-clamp-2">{cell.value}</span>
        {hint && (
          <span aria-label={row.releaseYear.hint === "higher" ? "later" : "earlier"}>{hint}</span>
        )}
      </div>
    </td>
  );
}

export function ClassicGrid({ results }: ClassicGridProps): React.JSX.Element {
  if (results.length === 0) {
    return (
      <div className="border border-dashed border-line-2 px-5 py-8 text-center">
        <p className="text-sm text-fg-2">
          Guess any champion. Every column is compared against today&apos;s answer from the very
          first guess.
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-fg-4">
          Green matches · amber shares a value · red does not
        </p>
      </div>
    );
  }

  // Newest first: the row that just landed is the one being read.
  const rows = results.filter((r) => r.row).reverse();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="hud-label px-1 pb-2 text-left">Guess</th>
            {CLASSIC_COLUMNS.map((column) => (
              <th key={column.key} className="hud-label px-1 pb-2 text-center">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((result, rowIndex) => (
            <tr key={result.guess} className="animate-hud-enter">
              <td className="p-0.5">
                <div className="tag-cut flex h-full min-h-[46px] items-center gap-2 border border-line-2 bg-surface-dark px-2">
                  <ChampionIcon name={result.row!.champion.name} size={26} />
                  <span className="truncate text-[12px] font-medium text-fg-1">
                    {result.row!.champion.name}
                  </span>
                </div>
              </td>
              {CLASSIC_COLUMNS.map((column, index) => (
                <Cell
                  key={column.key}
                  row={result.row!}
                  column={column}
                  // Only the row that just landed flips column by column; the
                  // ones behind it have already been read and should just be there.
                  delayMs={rowIndex === 0 ? index * 70 : 0}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
