import { Search } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The one text control on these screens: a name filter.
 *
 * Sunk rather than raised — an inset well on the darkest fill, which is how the design
 * system says "type here" without a border. The accent arrives on focus and nowhere else,
 * because the accent is rationed (ADR-015) and a row of glowing boxes spends it on nothing.
 *
 * The label is real and visually hidden rather than a `placeholder`: a placeholder is not a
 * label, and it is gone the moment the field has anything in it.
 */
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Announced, not shown. Two search boxes on one screen have to be told apart. */
  label: string;
  placeholder: string;
  className?: string;
}): React.ReactElement {
  const id = useId();
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={cn(
        "flex h-[38px] items-center gap-2.5 border border-transparent bg-surface-dark px-3",
        "transition-shadow duration-150 ease-out",
        focused ? "glow-accent" : "well",
        className
      )}
    >
      <Search
        aria-hidden
        className={cn("h-4 w-4 shrink-0", focused ? "text-accent" : "text-text-muted")}
      />
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // The ring would sit on the wrapper's glow and read as two focus states at once.
        className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
      />
    </div>
  );
}
