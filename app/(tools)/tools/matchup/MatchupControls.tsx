"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ChampionCombobox, type ChampionOption } from "@/domains/meta/components/ChampionCombobox";
import { ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta/positions";
import type { CanonicalPosition } from "@/domains/meta/types";
import { cn } from "@/lib/utils";

interface Props {
  champions: ChampionOption[];
  championA: string | null;
  championB: string | null;
  position: CanonicalPosition | null;
  availablePositions: CanonicalPosition[];
}

export function MatchupControls({
  champions,
  championA,
  championB,
  position,
  availablePositions,
}: Props) {
  const router = useRouter();

  function navigate(a: string | null, b: string | null, pos: CanonicalPosition | null): void {
    const params = new URLSearchParams();
    if (a) params.set("a", a);
    if (b) params.set("b", b);
    if (pos) params.set("role", pos);
    const query = params.toString();
    router.push(`/tools/matchup${query ? `?${query}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <ChampionCombobox
          champions={champions}
          value={championA}
          onSelect={(next) => navigate(next, championB, position)}
          placeholder="Your champion…"
          className="flex-1"
        />
        <ArrowRight className="mx-auto h-5 w-5 shrink-0 rotate-90 text-text-muted sm:rotate-0" />
        <ChampionCombobox
          champions={champions}
          value={championB}
          onSelect={(next) => navigate(championA, next, position)}
          placeholder="Opponent champion…"
          className="flex-1"
        />
      </div>

      {championA && championB && (
        <div className="flex flex-wrap gap-1.5">
          {ALL_POSITIONS.map((pos) => {
            const active = pos === position;
            const enabled = availablePositions.length === 0 || availablePositions.includes(pos);
            return (
              <button
                key={pos}
                type="button"
                disabled={!enabled}
                onClick={() => navigate(championA, championB, pos)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-accent text-background"
                    : "border border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text",
                  !enabled &&
                    "cursor-not-allowed opacity-40 hover:border-border hover:text-text-muted"
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
