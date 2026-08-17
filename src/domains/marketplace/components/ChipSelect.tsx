"use client";

import { cn } from "@/lib/utils";

export interface ChipOption {
  value: string;
  label: string;
}

interface ChipSelectProps {
  options: ChipOption[];
  selected: string[];
  onChange: (next: string[]) => void;
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
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
      return;
    }
    if (atCeiling) return;
    onChange([...selected, value]);
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
