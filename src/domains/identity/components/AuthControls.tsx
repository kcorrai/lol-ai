"use client";

import { forwardRef, useState } from "react";
import { ArrowRight, Lock, type LucideIcon } from "lucide-react";

interface AuthFieldProps {
  label: string;
  htmlFor: string;
  /** Sits under the control, in place of the error when there is none. */
  hint?: string;
  error?: string;
  /** Opposite the label — the show/hide toggle, or a link. */
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthField({
  label,
  htmlFor,
  hint,
  error,
  action,
  children,
}: AuthFieldProps): React.ReactElement {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="hud-label">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
}

/** An inset well with the icon inside it — the same box the search bar uses. */
export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { icon: Icon, ...props },
  ref,
) {
  return (
    <div className="well flex h-11 items-center border border-border bg-surface-dark focus-within:border-accent">
      <Icon className="ml-3 h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
      <input
        ref={ref}
        {...props}
        className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-text placeholder-text-muted outline-none"
      />
    </div>
  );
});

type PasswordFieldProps = Omit<AuthInputProps, "icon" | "type"> & {
  label: string;
  id: string;
  hint?: string;
  error?: string;
};

/**
 * Password with the design's show/hide toggle. The toggle sits in the label row rather than
 * inside the box, so it never overlaps a browser's own password affordances.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, id, hint, error, ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <AuthField
        label={label}
        htmlFor={id}
        hint={hint}
        error={error}
        action={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted transition-colors duration-150 hover:text-accent"
          >
            {visible ? "Hide" : "Show"}
          </button>
        }
      >
        <AuthInput id={id} type={visible ? "text" : "password"} icon={Lock} ref={ref} {...props} />
      </AuthField>
    );
  },
);

const BANDS = [
  { min: 78, label: "Strong", fill: "bg-accent" },
  { min: 40, label: "OK", fill: "bg-info" },
  { min: 1, label: "Weak", fill: "bg-danger" },
] as const;

/** Four independent points of evidence, so a long lowercase string never reads as strong. */
export function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 34;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 22;
  if (/\d/.test(password)) score += 22;
  if (/[^A-Za-z0-9]/.test(password)) score += 22;
  return Math.min(100, score);
}

export function PasswordMeter({ password }: { password: string }): React.ReactElement {
  const score = scorePassword(password);
  const band = BANDS.find((b) => score >= b.min);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="hud-label">Password strength</span>
        <span className="font-mono text-[11px] text-text-muted">{band?.label ?? "—"}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden bg-surface-dark">
        <div
          className={`h-full transition-[width] duration-200 ${band?.fill ?? ""}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

interface AuthCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}

/** Square by rule — the system has no round controls except avatars and meters. */
export function AuthCheckbox({
  id,
  checked,
  onChange,
  children,
}: AuthCheckboxProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 appearance-none border border-line-2 bg-surface-dark checked:border-accent checked:bg-accent"
      />
      <label htmlFor={id} className="text-[13px] text-text-body">
        {children}
      </label>
    </div>
  );
}

interface AuthSubmitProps {
  children: React.ReactNode;
  pending?: boolean;
  disabled?: boolean;
}

export function AuthSubmit({ children, pending, disabled }: AuthSubmitProps): React.ReactElement {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="tag-cut flex h-11 w-full items-center justify-center gap-2 bg-accent font-display text-xs font-bold uppercase tracking-[0.1em] text-background transition-colors duration-150 hover:bg-acid-400 active:translate-y-px active:bg-acid-600 disabled:bg-line-2 disabled:text-text-faint"
    >
      {children}
      <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
