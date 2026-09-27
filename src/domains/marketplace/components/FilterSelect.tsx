import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string;
  options: ReadonlyArray<FilterOption>;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * A labelled native select, dressed for the storefront console.
 *
 * Native on purpose: thirteen regions and thirteen languages are too many to lay
 * out as chips without burying the coaches under them, and a native control
 * keeps keyboard, screen reader and phone pickers working for free.
 */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: Props): React.ReactElement {
  const active = value !== "";

  return (
    <label className={cn("group relative block min-w-0", className)}>
      <span className="pointer-events-none absolute left-3 top-1.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-text-faint">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-12 w-full cursor-pointer appearance-none border bg-surface-dark pb-1.5 pl-3 pr-9 pt-4 text-[13.5px] transition-colors",
          "focus:outline-none focus-visible:border-accent",
          active ? "border-accent/50 text-accent" : "border-line-2 text-text hover:border-line-3"
        )}
      >
        {options.map((option) => (
          <option key={option.value || "any"} value={option.value} className="bg-surface text-text">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        aria-hidden
      />
    </label>
  );
}
