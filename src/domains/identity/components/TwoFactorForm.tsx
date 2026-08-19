"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { AuthPanel, AuthError, AuthNotice } from "./AuthPanel";
import { AuthField, AuthInput, AuthSubmit } from "./AuthControls";

// The password has already been accepted at this point; the session exists but is
// marked pending, and every other route refuses it until this passes. `update()` is
// what re-issues the cookie so the middleware stops sending the visitor back here.
export function TwoFactorForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();

  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Only a same-site path is followed. A `callbackUrl` is attacker-supplied — it
  // arrives in the query string — so an absolute one would turn the login flow into
  // an open redirect straight off the site's own domain.
  const rawCallback = searchParams.get("callbackUrl") ?? "/dashboard";
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//")
    ? rawCallback
    : "/dashboard";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/auth/2fa/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "totp"
            ? { type: "totp", token: value.trim() }
            : { type: "backup", code: value.trim() }
        ),
      });

      if (!res.ok) {
        setError(
          mode === "totp"
            ? "That code is not right, or it has already expired. Try the next one."
            : "That backup code is not right."
        );
        return;
      }

      await update();
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPanel
      kicker="Session"
      heading="Two-factor check"
      subheading="One more step — your password alone does not open this account."
    >
      <div className="space-y-4">
        <AuthNotice>
          {mode === "totp"
            ? "Open your authenticator app and enter the six-digit code."
            : "Enter one of the backup codes you saved when you turned 2FA on."}
        </AuthNotice>

        <form onSubmit={onSubmit} className="space-y-4">
          <AuthField
            label={mode === "totp" ? "Authentication code" : "Backup code"}
            htmlFor="twofactor-code"
          >
            <AuthInput
              id="twofactor-code"
              icon={mode === "totp" ? ShieldCheck : KeyRound}
              name="twofactor-code"
              inputMode={mode === "totp" ? "numeric" : "text"}
              autoComplete="one-time-code"
              placeholder={mode === "totp" ? "123456" : "A1B2C3D4"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </AuthField>

          {error && <AuthError>{error}</AuthError>}

          <AuthSubmit pending={pending} disabled={value.trim().length === 0}>
            {pending ? "Checking" : "Continue"}
          </AuthSubmit>
        </form>

        <div className="flex justify-between gap-3 font-mono text-[10.5px] uppercase tracking-[0.14em]">
          <button
            type="button"
            className="text-accent hover:text-acid-400"
            onClick={() => {
              setMode(mode === "totp" ? "backup" : "totp");
              setValue("");
              setError(null);
            }}
          >
            {mode === "totp" ? "Use a backup code" : "Use my authenticator"}
          </button>
          <button
            type="button"
            className="text-text-muted hover:text-accent"
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </button>
        </div>
      </div>
    </AuthPanel>
  );
}
