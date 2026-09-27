"use client";

import { useRouter } from "next/navigation";
import { ChampionCombobox, type ChampionOption } from "@/domains/meta/components/ChampionCombobox";
import { ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta/positions";
import type { CanonicalPosition } from "@/domains/meta/types";
import { hudChip } from "../../hudChip";

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
        <span className="mx-auto shrink-0 font-mono text-[11px] uppercase tracking-label text-text-muted">
          vs
        </span>
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
                className={hudChip(active, enabled)}
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
