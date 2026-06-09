"use client";

import type { TeamMemberSummary } from "@/domains/teams/types/teams.types";

interface TeamComparisonTableProps {
  members: TeamMemberSummary[];
}

export function TeamComparisonTable({ members }: TeamComparisonTableProps) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-[11px] text-text-muted">
            <th className="px-4 py-3 text-left">Oyuncu</th>
            <th className="px-4 py-3 text-center">Rank</th>
            <th className="px-4 py-3 text-center">7g WR</th>
            <th className="px-4 py-3 text-center">KDA</th>
            <th className="px-4 py-3 text-center">CS/dk</th>
            <th className="px-4 py-3 text-center">Vision</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.map((m) => (
            <tr key={m.userId} className="hover:bg-surface-2/50">
              <td className="px-4 py-3">
                <p className="font-medium text-text">{m.gameName}</p>
                <p className="text-[10px] text-text-muted capitalize">{m.role.toLowerCase()}</p>
              </td>
              <td className="px-4 py-3 text-center">
                {m.rank ? (
                  <span className="font-semibold text-accent">{m.rank.tier} {m.rank.division}</span>
                ) : <span className="text-text-muted">—</span>}
              </td>
              <td className="px-4 py-3 text-center">
                {m.winRate7d !== null ? (
                  <span className={m.winRate7d >= 55 ? "font-semibold text-success" : m.winRate7d < 45 ? "text-danger" : "text-text"}>
                    %{m.winRate7d}
                  </span>
                ) : <span className="text-text-muted">—</span>}
              </td>
              <td className="px-4 py-3 text-center text-text">{m.avgKDA7d ?? "—"}</td>
              <td className="px-4 py-3 text-center text-text">{m.avgCSPerMinute7d ?? "—"}</td>
              <td className="px-4 py-3 text-center text-text">{m.avgVisionScore7d ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
