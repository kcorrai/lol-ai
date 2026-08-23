"use client";

import type { MapDrill, MapDrillOption } from "@/domains/academy/types";
import { RiftMap } from "@/components/ui/RiftMap";

interface MapDrillBodyProps {
  drill: MapDrill;
  picked: string | null;
  locked: boolean;
  onPick: (ids: string[]) => void;
}

function ringClass(option: MapDrillOption, picked: string | null, locked: boolean): string {
  if (!locked) {
    return "border-line-3/70 bg-surface-dark/40 hover:border-accent hover:bg-[var(--surface-accent)]";
  }
  if (option.correct) return "border-acid-500 bg-acid-500/25";
  return option.id === picked ? "border-danger bg-danger/20" : "border-transparent";
}

/**
 * The spots are drawn on the map and nowhere else. Listing them as text underneath would turn a
 * map question back into a reading question, which is the thing this drill kind exists to stop —
 * so each option's words live in its accessible name, and appear on screen only once answered.
 */
export function MapDrillBody({ drill, picked, locked, onPick }: MapDrillBodyProps): React.ReactElement {
  return (
    <div className="mt-4">
      <div className="relative mx-auto aspect-square w-full max-w-[320px]">
        <RiftMap />

        {drill.options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-label={option.label}
            disabled={locked}
            onClick={() => onPick([option.id])}
            style={{
              left: `${option.at.x * 100}%`,
              top: `${option.at.y * 100}%`,
              width: `${option.at.r * 200}%`,
              height: `${option.at.r * 200}%`,
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors ${ringClass(
              option,
              picked,
              locked,
            )}`}
          />
        ))}
      </div>

      {locked && (
        <ul className="mt-4 flex flex-col gap-2">
          {drill.options
            .filter((option) => option.correct || option.id === picked)
            .map((option) => (
              <li key={option.id} className="text-[13px] leading-relaxed">
                <span className={option.correct ? "text-accent" : "text-danger"}>{option.label}</span>
                <span className="text-text-muted"> — {option.explain}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
