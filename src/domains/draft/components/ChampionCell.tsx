"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { LegalityReason } from "@/domains/draft";
import type { DraftChampion } from "@/domains/draft/draftCatalog.types";

// Said plainly, because "greyed out" is not an explanation. In a fearless series
// the difference between "taken this game" and "gone for the rest of the series"
// changes what you do next.
export const UNAVAILABLE_LABEL: Partial<Record<LegalityReason, string>> = {
  "already-used": "Taken this game",
  "series-locked": "Used earlier in the series",
  disabled: "Disabled for this draft",
};

interface Props {
  champion: DraftChampion;
  reason: LegalityReason | null;
  selected: boolean;
  highlighted: boolean;
  onSelect: () => void;
}

export function ChampionCell({
  champion,
  reason,
  selected,
  highlighted,
  onSelect,
}: Props): React.ReactElement {
  const label = reason ? UNAVAILABLE_LABEL[reason] : undefined;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={Boolean(reason)}
      aria-pressed={selected}
      title={label ?? champion.name}
      className={`notch-sm group relative flex flex-col items-center gap-1 border p-1.5 transition-colors ${
        selected
          ? "border-accent bg-accent/15"
          : highlighted
            ? "border-line-3 bg-surface-2"
            : "border-transparent hover:bg-surface-2"
      } ${reason ? "cursor-not-allowed opacity-35" : ""}`}
    >
      <ChampionIcon name={champion.key} size={44} />
      <span className="w-full truncate text-center text-[10.5px] leading-tight text-text-muted">
        {champion.name}
      </span>
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
}
