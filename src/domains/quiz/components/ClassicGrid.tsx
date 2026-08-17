"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { CLASSIC_COLUMNS, type ClassicRow, type GuessResult } from "@/domains/quiz";

interface ClassicGridProps {
  results: GuessResult[];
}

const CELL_TONE: Record<string, string> = {
  exact: "bg-accent/18 text-accent border-accent/40",
  partial: "bg-warning/18 text-warning border-warning/40",
  none: "bg-surface-dark text-fg-3 border-line-2",
};

function Cell({ row, column }: { row: ClassicRow; column: (typeof CLASSIC_COLUMNS)[number] }) {
  const cell = row[column.key];
  const isYear = column.key === "releaseYear";
  const hint = isYear ? (row.releaseYear.hint === "higher" ? "▲" : row.releaseYear.hint === "lower" ? "▼" : "") : "";

  return (
    <td className="p-0.5">
      <div
        className={`notch-sm flex h-full min-h-[52px] items-center justify-center gap-1 border px-1.5 py-1 text-center font-mono text-[10.5px] leading-tight ${CELL_TONE[cell.match]}`}
        title={cell.value}
      >
        <span className="line-clamp-2">{cell.value}</span>
        {hint && <span aria-label={row.releaseYear.hint === "higher" ? "later" : "earlier"}>{hint}</span>}
      </div>
    </td>
  );
}

export function ClassicGrid({ results }: ClassicGridProps): React.JSX.Element | null {
  if (results.length === 0) return null;

  // Newest first: the row that just landed is the one being read.
  const rows = results.filter((r) => r.row).reverse();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="hud-label px-1 pb-1.5 text-left">Guess</th>
            {CLASSIC_COLUMNS.map((column) => (
              <th key={column.key} className="hud-label px-1 pb-1.5 text-center">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((result) => (
            <tr key={result.guess}>
              <td className="p-0.5">
                <div className="notch-sm flex h-full min-h-[52px] items-center gap-2 border border-line-2 bg-surface-dark px-2">
                  <ChampionIcon name={result.row!.champion.name} size={28} />
                  <span className="truncate text-[11.5px] font-medium text-fg-1">
                    {result.row!.champion.name}
                  </span>
                </div>
              </td>
              {CLASSIC_COLUMNS.map((column) => (
                <Cell key={column.key} row={result.row!} column={column} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-fg-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 border border-accent/40 bg-accent/18" /> exact
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 border border-warning/40 bg-warning/18" /> shares
          a value
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 border border-line-2 bg-surface-dark" /> no
          overlap
        </span>
        <span>▲ released later · ▼ released earlier</span>
      </p>
    </div>
  );
}
