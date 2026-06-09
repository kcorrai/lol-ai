"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from "lucide-react";
import { useTeamDashboard } from "@/hooks/useTeamDashboard";
import { cn } from "@/lib/utils";
import type { TeamMemberSummary } from "@/domains/teams/types/teams.types";

type SortKey = "rank" | "winRate" | "kda" | "cs" | "vision";
type SortDir = "asc" | "desc";

const RANGES = [
  { value: "7d", label: "7G" },
  { value: "30d", label: "30G" },
  { value: "90d", label: "90G" },
] as const;

const RANK_ORDER = ["IRON","BRONZE","SILVER","GOLD","PLATINUM","EMERALD","DIAMOND","MASTER","GRANDMASTER","CHALLENGER"];
const DIV_ORDER = ["IV","III","II","I"];

function rankScore(m: TeamMemberSummary): number {
  if (!m.rank) return -1;
  const tierIdx = RANK_ORDER.indexOf(m.rank.tier);
  const divIdx = DIV_ORDER.indexOf(m.rank.division);
  return tierIdx * 400 + divIdx * 100 + m.rank.lp;
}

function sortMembers(members: TeamMemberSummary[], key: SortKey, dir: SortDir): TeamMemberSummary[] {
  return [...members].sort((a, b) => {
    let diff = 0;
    if (key === "rank") diff = rankScore(a) - rankScore(b);
    else if (key === "winRate") diff = (a.winRate7d ?? -1) - (b.winRate7d ?? -1);
    else if (key === "kda") diff = (a.avgKDA7d ?? -1) - (b.avgKDA7d ?? -1);
    else if (key === "cs") diff = (a.avgCSPerMinute7d ?? -1) - (b.avgCSPerMinute7d ?? -1);
    else if (key === "vision") diff = (a.avgVisionScore7d ?? -1) - (b.avgVisionScore7d ?? -1);
    return dir === "desc" ? -diff : diff;
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="inline ml-1 h-3 w-3 opacity-40" />;
  return dir === "desc"
    ? <ChevronDown className="inline ml-1 h-3 w-3 text-blue-400" />
    : <ChevronUp className="inline ml-1 h-3 w-3 text-blue-400" />;
}

interface TeamComparisonTableProps {
  teamId: string;
}

export function TeamComparisonTable({ teamId }: TeamComparisonTableProps) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "rank", dir: "desc" });
  const { data, isLoading } = useTeamDashboard(teamId, range);

  const members = useMemo(
    () => (data ? sortMembers(data.members, sort.key, sort.dir) : []),
    [data, sort]
  );

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }
    );
  }

  function Th({ label, sortKey }: { label: string; sortKey: SortKey }) {
    return (
      <th
        className="cursor-pointer select-none px-4 py-3 text-center text-[11px] text-text-muted hover:text-text"
        onClick={() => toggleSort(sortKey)}
      >
        {label}
        <SortIcon active={sort.key === sortKey} dir={sort.dir} />
      </th>
    );
  }

  return (
    <div className="space-y-3">
      {/* Range selector */}
      <div className="flex items-center gap-1">
        {RANGES.map((r) => (
          <button key={r.value} onClick={() => setRange(r.value)}
            className={cn("rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
              range === r.value ? "bg-blue-500/20 text-blue-400" : "text-text-muted hover:bg-white/5 hover:text-text")}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-x-auto">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-[11px] text-text-muted">Oyuncu</th>
                <Th label="Rank" sortKey="rank" />
                <Th label="WR" sortKey="winRate" />
                <Th label="KDA" sortKey="kda" />
                <Th label="CS/dk" sortKey="cs" />
                <Th label="Vision" sortKey="vision" />
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
                    {m.rank ? <span className="font-semibold text-accent">{m.rank.tier} {m.rank.division}</span> : <span className="text-text-muted">—</span>}
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
        )}
      </div>
    </div>
  );
}
