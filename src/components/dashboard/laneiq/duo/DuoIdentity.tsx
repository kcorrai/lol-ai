"use client";

import { Users, X } from "lucide-react";
import type { ActiveDuo } from "@/domains/analysis/services/duoService";

interface Props {
  partner: ActiveDuo;
  /** Consecutive shared results: positive is a win run, negative a loss run. */
  streak: number;
  onChange: () => void;
  onClear: () => void;
  isClearing: boolean;
}

function streakLabel(streak: number): string | null {
  if (Math.abs(streak) < 2) return null;
  return `${Math.abs(streak)} ${streak > 0 ? "wins" : "losses"} in a row`;
}

export function DuoIdentity({
  partner,
  streak,
  onChange,
  onClear,
  isClearing,
}: Props): React.ReactElement {
  const run = streakLabel(streak);

  return (
    <div className="border-b border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="hud-label">{"// Duo"}</p>
          <p className="mt-1.5 flex items-center gap-2 text-[15px] font-semibold text-text">
            <Users className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
            <span className="truncate">
              {partner.gameName}
              <span className="text-text-muted/70">#{partner.tagLine}</span>
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={isClearing}
          aria-label={`Remove ${partner.gameName} as duo`}
          className="shrink-0 p-1 text-text-muted transition-colors hover:text-text disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {run && (
        <p
          className={`mt-2 font-mono text-[11px] uppercase tracking-label ${
            streak > 0 ? "text-accent" : "text-danger"
          }`}
        >
          {run}
        </p>
      )}

      <button
        type="button"
        onClick={onChange}
        className="mt-3 font-mono text-[10.5px] uppercase tracking-label text-accent hover:underline"
      >
        Change duo
      </button>
    </div>
  );
}
