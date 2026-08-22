"use client";

import { cn } from "@/lib/utils";

/**
 * The three shapes every facet in the console is built from. They live together because they only
 * exist to keep the facet groups readable — a group should read as a list of facets, not as forty
 * lines of Tailwind repeated per control.
 */

export function FacetLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-label text-fg-4">
      {children}
    </span>
  );
}

interface ChipGroupProps<T extends string> {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  renderLabel?: (value: T) => string;
  /** Shown in place of the chips when the player's archive offers nothing to pick from. */
  emptyHint?: string;
}

/** Multi-select as chips. Never a `<select multiple>` — nobody has ever ctrl-clicked one on a phone. */
export function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
  renderLabel,
  emptyHint,
}: ChipGroupProps<T>): React.JSX.Element {
  return (
    <div>
      <FacetLabel>{label}</FacetLabel>
      {options.length === 0 ? (
        <p className="text-xs text-fg-4">{emptyHint ?? "Nothing to filter by yet."}</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(option)}
                className={cn(
                  "tag-cut border px-2 py-1 text-[11px] transition-colors",
                  active
                    ? "border-acid-500 bg-acid-500/10 text-acid-500"
                    : "border-line-2 text-fg-3 hover:border-line-3 hover:text-fg-1"
                )}
              >
                {renderLabel ? renderLabel(option) : option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder = "–",
}: NumberFieldProps): React.JSX.Element {
  return (
    <label className="flex items-center justify-between gap-2 text-[11px] text-fg-2">
      <span className="min-w-0 truncate">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        // An emptied box means "no threshold", not "zero" — a `minKills` of 0 matches everything and
        // would look identical to having cleared the field.
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") return onChange(undefined);
          const parsed = Number(raw);
          onChange(Number.isFinite(parsed) ? parsed : undefined);
        }}
        className="h-7 w-16 shrink-0 border border-line-2 bg-surface-dark px-1.5 text-right font-mono text-[11px] text-fg-1 focus:border-acid-500 focus:outline-none"
      />
    </label>
  );
}
