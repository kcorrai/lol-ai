import { useState } from "react";
import {
  isPairingCodeFormat,
  normalisePairingCode,
  PAIRING_CODE_LENGTH,
} from "../../../../src/domains/desktop/codeFormat";
import { cn } from "@/lib/cn";

/**
 * The code the player reads off the website.
 *
 * The format check is the website's own module, imported by relative path rather than
 * retyped (ADR-038, K6) — so the alphabet cannot drift apart between the two ends. It costs
 * a round trip to learn that "ABCDEFG0" was never a code, and there is no reason to spend it.
 */
export function CodeEntry({
  onSubmit,
  busy,
  disabled,
  error,
}: {
  onSubmit: (code: string) => Promise<void>;
  busy: boolean;
  disabled: boolean;
  error: string | null;
}): React.ReactElement {
  const [typed, setTyped] = useState("");

  const code = normalisePairingCode(typed);
  const complete = code.length >= PAIRING_CODE_LENGTH;
  const valid = isPairingCodeFormat(code);
  // Only once they have typed enough to be wrong. Reddening the field on the first
  // character is scolding someone for not having finished.
  const malformed = complete && !valid;

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !busy && !disabled) void onSubmit(code);
      }}
    >
      <label className="hud-label text-text-muted" htmlFor="pairing-code">
        Pairing code
      </label>
      <input
        id="pairing-code"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        disabled={disabled || busy}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        // Room for the separator the website prints, which people paste along with the code.
        maxLength={PAIRING_CODE_LENGTH + 4}
        placeholder="ABCD-EFGH"
        aria-invalid={malformed}
        className={cn(
          "notch border bg-surface-dark px-3 py-2.5 text-center font-mono text-xl",
          "font-bold uppercase tracking-[0.2em] text-text placeholder:text-text-faint",
          "disabled:opacity-50",
          malformed ? "border-danger" : "border-line-2 focus:border-accent"
        )}
      />

      {malformed && (
        <p className="text-xs text-danger">
          That is not a pairing code. They use no I, L, O, U, 0 or 1.
        </p>
      )}
      {error && !malformed && <p className="text-xs text-danger">{error}</p>}

      <button
        type="submit"
        disabled={!valid || busy || disabled}
        className={cn(
          "tag-cut px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-label",
          "bg-accent text-background transition-opacity hover:opacity-90",
          "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-faint"
        )}
      >
        {busy ? "Pairing…" : "Pair this device"}
      </button>
    </form>
  );
}
