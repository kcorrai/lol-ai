"use client";

import { useRouter } from "next/navigation";
import { ChampionCombobox, type ChampionOption } from "@/domains/meta/components/ChampionCombobox";
// Import from the leaf module, not the domain barrel: the barrel re-exports
// server-only services (logger → async_hooks) that must not enter the client bundle.
import { ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta/positions";
import type { CanonicalPosition } from "@/domains/meta/types";
import { cn } from "@/lib/utils";

interface Props {
  champions: ChampionOption[];
  champion: string | null; // Data Dragon key
  position: CanonicalPosition | null;
  availablePositions: CanonicalPosition[];
}

export function CounterPickerControls({
  champions,
  champion,
  position,
  availablePositions,
}: Props) {
  const router = useRouter();

  function navigate(nextChampion: string | null, nextPosition: CanonicalPosition | null): void {
    const params = new URLSearchParams();
    if (nextChampion) params.set("champion", nextChampion);
    if (nextPosition) params.set("role", nextPosition);
    const query = params.toString();
    router.push(`/tools/counter-picker${query ? `?${query}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ChampionCombobox
        champions={champions}
        value={champion}
        onSelect={(next) => navigate(next, position)}
        className="sm:w-72"
      />

      {champion && (
        <div className="flex flex-wrap gap-1.5">
          {ALL_POSITIONS.map((pos) => {
            const active = pos === position;
            const enabled = availablePositions.length === 0 || availablePositions.includes(pos);
            return (
              <button
                key={pos}
                type="button"
                disabled={!enabled}
                onClick={() => navigate(champion, pos)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-accent text-background"
                    : "border border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text",
                  !enabled && "cursor-not-allowed opacity-40 hover:border-border hover:text-text-muted"
                )}
              >
                {POSITION_LABELS[pos]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
