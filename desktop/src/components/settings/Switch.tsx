import { cn } from "@/lib/cn";

/**
 * One setting: a name, a sentence saying what it does, and the control that changes it.
 *
 * Extracted when the overlay's settings arrived, because the start-up toggle's markup would
 * otherwise have been copied five times — and a switch copied five times is five places for
 * the `aria-checked` to be forgotten in.
 */
export function SettingRow({
  label,
  description,
  control,
  error,
}: {
  label: string;
  description?: React.ReactNode;
  control: React.ReactNode;
  /** Said under the row, in the words the system used. Absent when nothing went wrong. */
  error?: string | null;
}): React.ReactElement {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-text">{label}</p>
          {description ? <p className="mt-1 text-xs text-text-muted">{description}</p> : null}
        </div>
        <div className="shrink-0">{control}</div>
      </div>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

/**
 * A two-state control that says which state it is in to a screen reader as well as to an eye.
 *
 * `role="switch"` with `aria-checked` rather than a checkbox: it takes effect the moment it
 * is pressed and there is no form to submit, which is the distinction the two roles carry.
 *
 * The label is required and not optional. This control is a rectangle with a smaller
 * rectangle in it; without a name, a screen reader has nothing to announce but "switch".
 */
export function Switch({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "notch-sm mt-0.5 h-6 w-11 shrink-0 border transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        disabled
          ? "cursor-not-allowed border-line-1 bg-surface opacity-50"
          : "cursor-pointer border-line-2",
        checked ? "bg-accent" : "bg-surface"
      )}
    >
      <span
        className={cn(
          "block h-4 w-4 bg-text transition-transform duration-150 motion-reduce:transition-none",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
