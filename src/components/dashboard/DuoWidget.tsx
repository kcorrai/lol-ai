"use client";

import { useState } from "react";
import { Users, X } from "lucide-react";
import { useDuo, useDuoCandidates, useSetDuo, useClearDuo } from "@/hooks/useDuo";
import { DuoPicker } from "./DuoPicker";

interface Props {
  riotAccountId: string | null | undefined;
}

export function DuoWidget({ riotAccountId }: Props) {
  const [picking, setPicking] = useState(false);
  const { data: duo, isLoading } = useDuo(riotAccountId);
  const { data: candidates } = useDuoCandidates(riotAccountId, picking || !duo);
  const setDuo = useSetDuo(riotAccountId);
  const clearDuo = useClearDuo(riotAccountId);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-surface p-4">
        <div className="h-3 w-24 rounded bg-border" />
        <div className="mt-3 h-10 w-full rounded bg-border" />
      </div>
    );
  }

  if (duo && !picking) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-accent" />
              <span className="truncate text-sm font-semibold text-text">
                {duo.gameName}
                <span className="text-text-muted/70">#{duo.tagLine}</span>
              </span>
            </div>
            <p className="mt-1.5 text-xs text-text-muted">
              {duo.games > 0 ? (
                <>
                  {duo.games} games together ·{" "}
                  <span className={duo.winRate >= 50 ? "text-success" : "text-danger"}>
                    {duo.winRate}% win rate
                  </span>
                </>
              ) : (
                "No shared games in your recent history yet."
              )}
            </p>
          </div>
          <button
            onClick={() => clearDuo.mutate()}
            disabled={clearDuo.isPending}
            aria-label="Remove duo"
            className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => setPicking(true)}
          className="mt-3 text-[11px] font-semibold text-accent hover:underline"
        >
          Change duo
        </button>
      </div>
    );
  }

  return (
    <DuoPicker
      candidates={candidates ?? []}
      isSaving={setDuo.isPending}
      error={setDuo.error?.message ?? null}
      onPick={(input) => setDuo.mutate(input, { onSuccess: () => setPicking(false) })}
      onCancel={duo ? () => setPicking(false) : undefined}
    />
  );
}
