"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Shield, ShieldCheck, ShieldOff, Copy, Check, Eye, EyeOff } from "lucide-react";

type Step = "idle" | "setup" | "backup" | "verify" | "enabled" | "disable";

export default function SecuritySettingsPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showCodes, setShowCodes] = useState(false);

  const userId = session?.user?.id;

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
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
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
      setError(err instanceof Error ? err.message : "Geçersiz kod");
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
      setError(err instanceof Error ? err.message : "Geçersiz kod");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode(code: string, index: number) {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  if (!userId) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Güvenlik</h1>
        <p className="mt-1 text-sm text-text-muted">
          Hesabını iki faktörlü kimlik doğrulama ile güvence altına al.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
      )}

      {/* IDLE — 2FA not set up */}
      {(step === "idle") && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-start gap-4">
            <ShieldOff className="mt-0.5 h-8 w-8 shrink-0 text-text-muted" />
            <div>
              <p className="text-sm font-semibold text-text">İki Faktörlü Doğrulama</p>
              <p className="mt-1 text-xs text-text-muted">
                Google Authenticator veya benzeri bir uygulama ile giriş güvenliğini artır.
              </p>
            </div>
          </div>
          <button
            onClick={startSetup}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:bg-accent/90 disabled:opacity-50"
          >
            <Shield className="h-4 w-4" />
            {loading ? "Hazırlanıyor…" : "2FA Kurulumunu Başlat"}
          </button>
        </div>
      )}

      {/* SETUP — show QR code */}
      {step === "setup" && qrDataUrl && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <p className="text-sm font-semibold text-text">Adım 1: QR Kodu Tarat</p>
          <p className="text-xs text-text-muted">
            Google Authenticator veya Authy uygulamasıyla aşağıdaki QR kodu tarat.
          </p>
          <div className="flex justify-center">
            <Image src={qrDataUrl} alt="TOTP QR Code" width={180} height={180} className="rounded-xl" />
          </div>
          <button
            onClick={() => setStep("backup")}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:bg-accent/90"
          >
            Yedek Kodlara Geç →
          </button>
        </div>
      )}

      {/* BACKUP — show backup codes */}
      {step === "backup" && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">Adım 2: Yedek Kodları Sakla</p>
            <button onClick={() => setShowCodes(!showCodes)} className="text-text-muted hover:text-text">
              {showCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-text-muted">
            Bu kodları güvenli bir yere kaydet. Her kod bir kez kullanılabilir.
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
            Kodu Girerek Doğrula →
          </button>
        </div>
      )}

      {/* VERIFY — enter TOTP token */}
      {step === "verify" && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <p className="text-sm font-semibold text-text">Adım 3: Kodu Doğrula</p>
          <p className="text-xs text-text-muted">
            Authenticator uygulamasındaki 6 haneli kodu gir.
          </p>
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
            {loading ? "Doğrulanıyor…" : "2FA Etkinleştir"}
          </button>
        </div>
      )}

      {/* ENABLED — success state */}
      {step === "enabled" && (
        <div className="rounded-xl border border-green-500/20 bg-surface p-5 space-y-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-green-400" />
            <p className="text-sm font-semibold text-green-400">2FA Etkinleştirildi</p>
          </div>
          <p className="text-xs text-text-muted">
            Hesabın artık iki faktörlü doğrulama ile korunuyor.
          </p>
          <button
            onClick={() => setStep("disable")}
            className="text-xs text-red-400 hover:underline"
          >
            2FA&apos;yı devre dışı bırak
          </button>
        </div>
      )}

      {/* DISABLE — confirm with token */}
      {step === "disable" && (
        <div className="rounded-xl border border-red-500/20 bg-surface p-5 space-y-4">
          <p className="text-sm font-semibold text-red-400">2FA Devre Dışı Bırak</p>
          <p className="text-xs text-text-muted">
            Authenticator uygulamasındaki kodu girerek devre dışı bırakabilirsin.
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
              {loading ? "İşleniyor…" : "Devre Dışı Bırak"}
            </button>
            <button
              onClick={() => { setStep("enabled"); setError(null); }}
              className="rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-semibold text-text hover:bg-accent hover:text-background"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
