"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMatchupMatrix } from "@/hooks/useMatchupMatrix";
import { MatchupMatrixCell } from "./MatchupMatrixCell";
import { MatchupGuidePanel } from "./MatchupGuidePanel";
import type { MatchupCell } from "@/domains/analysis/services/matchupService";
import { cn } from "@/lib/utils";

const POSITIONS = [
  { value: undefined,    label: "Tümü" },
  { value: "TOP",        label: "Top" },
  { value: "JUNGLE",     label: "Jungle" },
  { value: "MIDDLE",     label: "Mid" },
  { value: "BOTTOM",     label: "ADC" },
  { value: "UTILITY",    label: "Support" },
];

interface Props {
  riotAccountId: string | null;
}

export function MatchupMatrix({ riotAccountId }: Props) {
  const [position, setPosition] = useState<string | undefined>(undefined);
  const [selectedCell, setSelectedCell] = useState<MatchupCell | null>(null);
  const { data, isLoading } = useMatchupMatrix(riotAccountId, position);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span className="text-sm">Matchup verisi hesaplanıyor…</span>
      </div>
    );
  }

  if (!data || data.playerChampions.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-text-muted">
        Yeterli ranked maç verisi bulunamadı.
        <br />
        <span className="text-xs">En az 1 lane matchup için ranked maç gerekli.</span>
      </div>
    );
  }

  // Build cell lookup: "playerChamp|||opponentChamp" → MatchupCell
  const cellMap = new Map<string, MatchupCell>();
  for (const cell of data.cells) {
    cellMap.set(`${cell.playerChampion}|||${cell.opponentChampion}`, cell);
  }

  return (
    <div>
      {/* Position filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {POSITIONS.map((p) => (
          <button
            key={p.label}
            onClick={() => setPosition(p.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              position === p.value
                ? "bg-accent text-background"
                : "bg-surface-2 text-text-muted hover:text-text"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] text-text-muted">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-success/40" />≥60%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-success/20" />50-59%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-yellow-500/20" />45-49%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-danger/20" />40-44%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-danger/40" />&lt;40%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-surface-2" />{"<3 maç"}</span>
      </div>

      {/* Scrollable matrix */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-max border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[100px] bg-surface px-3 py-2 text-left text-text-muted" />
              {data.opponentChampions.map((opp) => (
                <th key={opp} className="px-1 py-2 text-center font-normal text-text-muted" title={opp}>
                  <div className="w-16 overflow-hidden text-ellipsis whitespace-nowrap">{opp}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.playerChampions.map((player) => (
              <tr key={player} className="border-t border-border/50">
                <td className="sticky left-0 z-10 min-w-[100px] bg-surface px-3 py-1 font-semibold text-text">
                  {player}
                </td>
                {data.opponentChampions.map((opp) => {
                  const cell = cellMap.get(`${player}|||${opp}`);
                  return (
                    <td key={opp} className="px-1 py-1">
                      <MatchupMatrixCell cell={cell} onClick={setSelectedCell} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[10px] text-text-muted">
        Son hesaplama: {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString("tr-TR") : "—"}
        {" · "}Hücreye tıkla → AI matchup rehberi
      </p>

      <MatchupGuidePanel cell={selectedCell} onClose={() => setSelectedCell(null)} />
    </div>
  );
}
