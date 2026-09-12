"use client";

import { ACADEMY_ITEMS } from "@/domains/academy/assets";
import type { MapDrill, MapDrillOption } from "@/domains/academy/types";
import { itemIconUrl } from "@/lib/ddragon";
import { RiftMap } from "@/components/ui/RiftMap";

interface MapDrillBodyProps {
  drill: MapDrill;
  picked: string | null;
  locked: boolean;
  onPick: (ids: string[]) => void;
}

const WARD_ICON = itemIconUrl(ACADEMY_ITEMS["control-ward"].id);

function markerClass(option: MapDrillOption, picked: string | null, locked: boolean): string {
  if (!locked) {
    return "animate-academy-ward border-fg-1/50 bg-surface-dark/60 hover:border-accent hover:bg-[var(--surface-accent)]";
  }
  if (option.correct) {
    return "animate-academy-ward-hit border-acid-500 bg-acid-500/25 shadow-[0_0_14px_rgba(198,255,61,0.55)]";
  }
  if (option.id === picked) {
    return "animate-academy-ward-miss border-danger bg-danger/25 shadow-[0_0_12px_rgba(255,90,90,0.45)]";
  }
  return "border-transparent opacity-0";
}

/**
 * The spots are drawn on the map and nowhere else. Listing them as text underneath would turn a
 * map question back into a reading question, which is the thing this drill kind exists to stop —
 * so each option's words live in its accessible name, and appear on screen only once answered.
 *
 * Each candidate is a ward turned on its corner: the marker says what the answer *is* before the
 * reader has parsed anything, which is what lets the map carry the question on its own.
 */
export function MapDrillBody({
  drill,
  picked,
  locked,
  onPick,
}: MapDrillBodyProps): React.ReactElement {
  return (
    <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="well relative mx-auto aspect-square w-full max-w-[320px] border border-line-2">
        <RiftMap />
        <span aria-hidden className="bg-scanline pointer-events-none absolute inset-0" />

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
              // The marker sits on its corner, so its own transform has to carry the centring
              // too — the keyframes restate all three parts for the same reason.
              transform: "translate(-50%,-50%) rotate(45deg)",
            }}
            className={`absolute grid place-items-center overflow-hidden border transition-colors ${markerClass(
              option,
              picked,
              locked
            )}`}
          >
            <span
              aria-hidden
              className="block h-[62%] w-[62%] -rotate-45 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${WARD_ICON})` }}
            />
          </button>
        ))}
      </div>

      <div className="flex flex-col justify-center">
        {locked ? (
          <ul className="grid gap-2.5">
            {drill.options
              .filter((option) => option.correct || option.id === picked)
              .map((option) => (
                <li
                  key={option.id}
                  className={`tag-cut border px-3.5 py-3 text-[13px] leading-relaxed ${
                    option.correct
                      ? "border-acid-500 bg-[var(--surface-accent)]"
                      : "border-danger bg-danger/10"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${
                      option.correct ? "text-accent" : "text-danger"
                    }`}
                  >
                    {option.correct ? "That is the one" : "Not that one"}
                  </span>
                  <span className="mt-1.5 block text-text">{option.label}</span>
                  <span className="mt-1 block text-text-body">{option.explain}</span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="hud-label text-text-faint">
            {drill.options.length} spots are live on the map. Pick one.
          </p>
        )}
      </div>
    </div>
  );
}
