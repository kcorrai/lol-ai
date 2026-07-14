"use client";

import { useState } from "react";
import Image from "next/image";
import { Shield, ShieldCheck, ShieldOff, Copy, Check, Eye, EyeOff } from "lucide-react";

type Step = "idle" | "setup" | "backup" | "verify" | "enabled" | "disable";

export function TwoFactorSetup() {
  const [step, setStep] = useState<Step>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showCodes, setShowCodes] = useState(false);

  async function startSetup() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/setup");
      const json = await res.json() as { data?: { qrDataUrl: string; backupCodes: string[] }; error?: { message: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Setup failed");
      setQrDataUrl(json.data!.qrDataUrl);
      setBackupCodes(json.data!.backupCodes);
      setStep("setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndEnable() {
    if (token.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, backupCodes }),
      });
      const json = await res.json() as { data?: { enabled: boolean }; error?: { message: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Verification failed");
      setStep("enabled");
      setToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpToken: disableToken }),
      });
      const json = await res.json() as { data?: { disabled: boolean }; error?: { message: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Disable failed");
      setStep("idle");
      setDisableToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode(code: string, index: number) {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <>
      {error && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
      )}

      {step === "idle" && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-start gap-4">
            <ShieldOff className="mt-0.5 h-8 w-8 shrink-0 text-text-muted" />
            <div>
              <p className="text-sm font-semibold text-text">Two-Factor Authentication</p>
              <p className="mt-1 text-xs text-text-muted">
                Enhance login security with Google Authenticator or similar app.
              </p>
            </div>
          </div>
          <button
            onClick={startSetup}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:bg-accent/90 disabled:opacity-50"
          >
            <Shield className="h-4 w-4" />
            {loading ? "Preparing…" : "Start 2FA Setup"}
          </button>
        </div>
      )}

      {step === "setup" && qrDataUrl && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <p className="text-sm font-semibold text-text">Step 1: Scan QR Code</p>
          <p className="text-xs text-text-muted">
            Scan the QR code below with Google Authenticator or Authy.
          </p>
          <div className="flex justify-center">
            <Image src={qrDataUrl} alt="TOTP QR Code" width={180} height={180} className="rounded-xl" />
          </div>
          <button
            onClick={() => setStep("backup")}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:bg-accent/90"
          >
            Go to Backup Codes →
          </button>
        </div>
      )}

      {step === "backup" && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">Step 2: Save Backup Codes</p>
            <button onClick={() => setShowCodes(!showCodes)} className="text-text-muted hover:text-text">
              {showCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-text-muted">
            Save these codes in a secure place. Each code can be used once.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                <span className="font-mono text-xs text-text">
                  {showCodes ? code : "••••••••"}
                </span>
                <button onClick={() => copyCode(code, i)} className="ml-2 text-text-muted hover:text-text">
                  {copiedIndex === i ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep("verify")}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:bg-accent/90"
          >
            Verify by Entering Code →
          </button>
        </div>
      )}

      {step === "verify" && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <p className="text-sm font-semibold text-text">Step 3: Verify Code</p>
          <p className="text-xs text-text-muted">Enter the 6-digit code from your authenticator app.</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-center font-mono text-xl tracking-[0.4em] text-text placeholder-text-muted focus:border-accent focus:outline-none"
          />
          <button
            onClick={verifyAndEnable}
            disabled={loading || token.length !== 6}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Enable 2FA"}
          </button>
        </div>
      )}

      {step === "enabled" && (
        <div className="rounded-xl border border-green-500/20 bg-surface p-5 space-y-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-green-400" />
            <p className="text-sm font-semibold text-green-400">2FA Enabled</p>
          </div>
          <p className="text-xs text-text-muted">Your account is now protected with two-factor authentication.</p>
          <button onClick={() => setStep("disable")} className="text-xs text-red-400 hover:underline">
            Disable 2FA
          </button>
        </div>
      )}

      {step === "disable" && (
        <div className="rounded-xl border border-red-500/20 bg-surface p-5 space-y-4">
          <p className="text-sm font-semibold text-red-400">Disable 2FA</p>
          <p className="text-xs text-text-muted">
            You can disable it by entering the code from your authenticator app.
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={disableToken}
            onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-center font-mono text-xl tracking-[0.4em] text-text placeholder-text-muted focus:border-red-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={disable}
              disabled={loading || disableToken.length !== 6}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Processing…" : "Disable"}
            </button>
            <button
              onClick={() => { setStep("enabled"); setError(null); }}
              className="rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-semibold text-text hover:bg-accent hover:text-background"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
