"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DuoCandidate } from "@/domains/analysis/services/duoService";

interface Props {
  candidates: DuoCandidate[];
  isSaving: boolean;
  error: string | null;
  onPick: (input: { puuid?: string; riotId?: string }) => void;
  onCancel?: () => void;
}

export function DuoPicker({ candidates, isSaving, error, onPick, onCancel }: Props) {
  const [riotId, setRiotId] = useState("");

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-text">Pick your duo</h3>
      </div>

      {candidates.length > 0 ? (
        <>
          <p className="mt-1.5 text-xs text-text-muted">
            The players you queue with most, from your synced matches.
          </p>
          <ul className="mt-3 space-y-1.5">
            {candidates.map((c) => (
              <li key={c.puuid}>
                <button
                  onClick={() => onPick({ puuid: c.puuid })}
                  disabled={isSaving}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-left transition-colors hover:border-accent/40 hover:bg-surface-2 disabled:opacity-50"
                >
                  <span className="min-w-0 truncate text-sm text-text">
                    {c.gameName}
                    <span className="text-text-muted/70">#{c.tagLine}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-text-muted">
                    {c.games}g ·{" "}
                    <span className={c.winRate >= 50 ? "text-success" : "text-danger"}>
                      {c.winRate}%
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-1.5 text-xs text-text-muted">
          We haven&apos;t spotted a regular teammate yet. Sync more games, or enter their Riot ID
          below.
        </p>
      )}

      <form
        className="mt-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (riotId.includes("#")) onPick({ riotId: riotId.trim() });
        }}
      >
        <label htmlFor="duo-riot-id" className="block text-[11px] font-medium text-text-muted">
          Or enter their Riot ID
        </label>
        <div className="flex gap-2">
          <input
            id="duo-riot-id"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="Name#TAG"
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
          />
          <Button type="submit" size="sm" disabled={!riotId.includes("#") || isSaving}>
            {isSaving ? "Saving…" : "Set duo"}
          </Button>
        </div>
      </form>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {onCancel && (
        <button onClick={onCancel} className="mt-3 text-[11px] text-text-muted hover:text-text">
          Cancel
        </button>
      )}
    </div>
  );
}
