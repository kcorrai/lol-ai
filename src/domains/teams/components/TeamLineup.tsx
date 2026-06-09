"use client";

import { useEffect, useState } from "react";
import type { TeamMemberSummary } from "@/domains/teams/types/teams.types";

const POSITIONS = [
  { key: "top",     label: "Üst",     abbr: "TOP" },
  { key: "jungle",  label: "Orman",   abbr: "JGL" },
  { key: "mid",     label: "Orta",    abbr: "MID" },
  { key: "bot",     label: "Alt",     abbr: "BOT" },
  { key: "support", label: "Destek",  abbr: "SUP" },
] as const;

type PositionKey = typeof POSITIONS[number]["key"];
type Lineup = Record<PositionKey, string | null>;

const EMPTY: Lineup = { top: null, jungle: null, mid: null, bot: null, support: null };

interface Props {
  teamId: string;
  members: TeamMemberSummary[];
  canManage: boolean;
}

export function TeamLineup({ teamId, members, canManage }: Props) {
  const [lineup, setLineup] = useState<Lineup>(EMPTY);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`lineup-${teamId}`);
      if (stored) setLineup({ ...EMPTY, ...(JSON.parse(stored) as Partial<Lineup>) });
    } catch {
      // ignore parse errors
    }
  }, [teamId]);

  function assign(pos: PositionKey, userId: string | null) {
    const next = { ...lineup, [pos]: userId };
    setLineup(next);
    localStorage.setItem(`lineup-${teamId}`, JSON.stringify(next));
  }

  function assignedMember(pos: PositionKey): TeamMemberSummary | null {
    const uid = lineup[pos];
    return uid ? (members.find((m) => m.userId === uid) ?? null) : null;
  }

  const assignedIds = new Set(Object.values(lineup).filter(Boolean) as string[]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted/50">Kadro</p>
        {canManage && (
          <button
            onClick={() => {
              setLineup(EMPTY);
              localStorage.removeItem(`lineup-${teamId}`);
            }}
            className="text-[10px] text-text-muted/40 hover:text-text-muted transition-colors"
          >
            Sıfırla
          </button>
        )}
      </div>

      {POSITIONS.map((pos) => {
        const member = assignedMember(pos.key);
        const available = members.filter((m) => !assignedIds.has(m.userId) || lineup[pos.key] === m.userId);

        return (
          <div
            key={pos.key}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-text-muted">
              {pos.abbr}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50">{pos.label}</p>
              {member ? (
                <p className="text-sm font-semibold text-text truncate">
                  {member.gameName}
                  <span className="ml-1 text-xs font-normal text-text-muted">#{member.tagLine}</span>
                </p>
              ) : (
                <p className="text-sm text-text-muted/50">Boş</p>
              )}
            </div>

            {canManage && (
              <select
                value={lineup[pos.key] ?? ""}
                onChange={(e) => assign(pos.key, e.target.value || null)}
                className="shrink-0 rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              >
                <option value="">— Seç —</option>
                {available.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.gameName}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
