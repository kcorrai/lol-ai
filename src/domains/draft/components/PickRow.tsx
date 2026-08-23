"use client";

import { championLoadingUrl } from "@/lib/ddragon";
import type { DraftSide } from "@/domains/draft";
import type { DraftChampion } from "@/domains/draft/draftCatalog.types";

const ROLE_LABELS = ["Top", "Jungle", "Mid", "Bot", "Support"] as const;

interface PickRowProps {
  side: DraftSide;
  /** Slot index 0–4, which also names the row's nominal role. */
  index: number;
  champion: DraftChampion | null;
  /** This is the slot the current turn will fill. */
  pending: boolean;
  filled: boolean;
  timedOut: boolean;
}

/**
 * A pick as a wide row carrying its own splash.
 *
 * The square tile column read as five more grid cells beside a grid of two
 * hundred. A row the width of the column, with the champion's own art behind
 * the name, is the thing a caster or a coach can read across the table.
 *
 * The role label is the slot's nominal position, not a claim about the draft —
 * teams pick out of order all the time, so it is set in the muted label colour
 * until the slot is filled.
 */
export function PickRow({
  side,
  index,
  champion,
  pending,
  filled,
  timedOut,
}: PickRowProps): React.JSX.Element {
  const blue = side === "BLUE";
  const roleColor = champion ? (blue ? "text-accent-blue" : "text-danger") : "text-text-muted";

  // One border colour, decided once. Concatenating a neutral class and an accent
  // class leaves two border-color utilities of equal specificity on the element,
  // and which one wins is then down to stylesheet order rather than intent.
  const borderColor =
    pending || champion ? (blue ? "border-accent-blue" : "border-danger") : "border-line-1";

  return (
    <div
      className={`notch relative min-h-[62px] flex-1 overflow-hidden border bg-surface ${borderColor} ${
        pending ? "animate-glow-pulse" : ""
      } ${blue ? "border-l-[3px]" : "border-r-[3px]"}`}
      aria-label={
        filled
          ? `${blue ? "Blue" : "Red"} pick ${index + 1}: ${champion?.name ?? "none"}`
          : `Empty ${blue ? "blue" : "red"} pick slot ${index + 1}`
      }
    >
      {champion && (
        <>
          <span
            className="absolute inset-0 bg-cover opacity-50"
            style={{
              backgroundImage: `url('${championLoadingUrl(champion.key)}')`,
              backgroundPosition: "50% 18%",
            }}
            aria-hidden
          />
          <span
            className={`absolute inset-0 ${
              blue
                ? "bg-gradient-to-r from-ink-1000/95 to-ink-1000/40"
                : "bg-gradient-to-l from-ink-1000/95 to-ink-1000/40"
            }`}
            aria-hidden
          />
        </>
      )}

      <span
        className={`relative flex h-full items-center gap-2.5 px-3 py-2.5 ${
          blue ? "justify-between" : "flex-row-reverse justify-between"
        }`}
      >
        <span className={`min-w-0 ${blue ? "" : "text-right"}`}>
          <span className={`block font-mono text-[9px] uppercase tracking-micro ${roleColor}`}>
            {ROLE_LABELS[index]}
          </span>
          <span
            className={`mt-1 block truncate font-display text-[15px] font-bold uppercase tracking-wide ${
              champion ? "text-fg-1" : "text-fg-4"
            }`}
          >
            {champion ? champion.name : pending ? "Picking…" : filled ? "—" : "—"}
          </span>
        </span>

        {champion && champion.winRate > 0 && (
          <span
            className={`shrink-0 font-mono text-[11px] ${
              champion.winRate >= 51.5 ? "text-acid-500" : "text-fg-3"
            }`}
          >
            {champion.winRate.toFixed(1)}%
          </span>
        )}
        {timedOut && (
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-warning">
            auto
          </span>
        )}
      </span>
    </div>
  );
}
