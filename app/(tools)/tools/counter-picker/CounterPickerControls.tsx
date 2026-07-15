"use client";

import { useRouter } from "next/navigation";
import { ChampionCombobox, type ChampionOption } from "@/domains/meta/components/ChampionCombobox";
// Import from leaf modules, not the domain barrel: the barrel re-exports
// server-only services (logger → async_hooks) that must not enter the client bundle.
import { ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta/positions";
import { SNAPSHOT_TIERS, TIER_LABELS, type SnapshotTier } from "@/domains/meta/services/opggShared";
import type { CanonicalPosition } from "@/domains/meta/types";
import { cn } from "@/lib/utils";

interface Props {
  champions: ChampionOption[];
  champion: string | null; // Data Dragon key
  position: CanonicalPosition | null;
  availablePositions: CanonicalPosition[];
  tier: SnapshotTier | null; // active rank bracket (null = op.gg default)
}

const pillBase = "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors";
const activePill = "bg-accent text-background";
const idlePill = "border border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text";

export function CounterPickerControls({
  champions,
  champion,
  position,
  availablePositions,
  tier,
}: Props) {
  const router = useRouter();

  function navigate(
    nextChampion: string | null,
    nextPosition: CanonicalPosition | null,
    nextTier: SnapshotTier | null
  ): void {
    const params = new URLSearchParams();
    if (nextChampion) params.set("champion", nextChampion);
    if (nextPosition) params.set("role", nextPosition);
    if (nextTier) params.set("tier", nextTier);
    const query = params.toString();
    router.push(`/tools/counter-picker${query ? `?${query}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ChampionCombobox
          champions={champions}
          value={champion}
          // Reset the lane on champion change so the URL never keeps a role the
          // new champion doesn't play (which would desync the URL from the data).
          onSelect={(next) => navigate(next, null, tier)}
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
                  onClick={() => navigate(champion, pos, tier)}
                  className={cn(
                    pillBase,
                    active ? activePill : idlePill,
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

      {champion && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] uppercase tracking-wide text-text-muted">Rank</span>
          <button
            type="button"
            onClick={() => navigate(champion, position, null)}
            className={cn(pillBase, tier === null ? activePill : idlePill)}
          >
            Default
          </button>
          {SNAPSHOT_TIERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => navigate(champion, position, t)}
              className={cn(pillBase, t === tier ? activePill : idlePill)}
            >
              {TIER_LABELS[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
