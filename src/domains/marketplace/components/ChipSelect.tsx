"use client";

import { cn } from "@/lib/utils";

export interface ChipOption {
  value: string;
  label: string;
}

interface ChipSelectProps {
  options: ChipOption[];
  selected: string[];
  /**
   * Takes an updater, not the next array — pass a `useState` setter straight in.
   *
   * Deliberately not `(next: string[]) => void`. Computing the next array here
   * would have to read the `selected` prop, and two toggles inside one batch
   * both see the same render's value, so the second silently discards the
   * first. Two chips clicked quickly used to lose one.
   */
  onChange: (updater: (prev: string[]) => string[]) => void;
  /** Refuses further selections once reached. Undefined means no ceiling. */
  max?: number;
  disabled?: boolean;
  "aria-label": string;
}

/**
 * A multi-select rendered as toggleable chips.
 *
 * A native multi-select is unusable on touch and invisible about what is
 * chosen; these are the fields a coach fills in most and gets wrong most
 * (languages, regions, roles), so the whole set stays on screen with the
 * chosen ones lit.
 */
export function ChipSelect({
  options,
  selected,
  onChange,
  max,
  disabled,
  "aria-label": ariaLabel,
}: ChipSelectProps): React.ReactElement {
  const atCeiling = max !== undefined && selected.length >= max;

  function toggle(value: string): void {
    onChange((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      // Re-checked against `prev` rather than the render's `selected`, for the
      // same reason the updater exists at all.
      if (max !== undefined && prev.length >= max) return prev;
      return [...prev, value];
    });
  }

  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        // Unselected chips go dead once the ceiling is hit, but selected ones
        // stay live — otherwise the only way out of a full set is a reload.
        const isLocked = Boolean(disabled) || (atCeiling && !isSelected);

        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            disabled={isLocked}
            onClick={() => toggle(option.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              isSelected
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface-2 text-text-muted hover:text-text",
              isLocked && "cursor-not-allowed opacity-40 hover:text-text-muted"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
