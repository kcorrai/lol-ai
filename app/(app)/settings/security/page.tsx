"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { Shield, ShieldCheck, ShieldOff, Copy, Check, Eye, EyeOff, Monitor, Smartphone, LogOut } from "lucide-react";

interface UserSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
}

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

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/sessions");
      const json = await res.json() as { data: UserSession[] };
      setSessions(json.data ?? []);
    } catch { /* non-critical */ }
    finally { setSessionsLoading(false); }
  }, []);

  useEffect(() => { void loadSessions(); }, [loadSessions]);

  function parseDevice(userAgent: string | null): { label: string; icon: "desktop" | "mobile" } {
    if (!userAgent) return { label: "Bilinmeyen Cihaz", icon: "desktop" };
    const ua = userAgent.toLowerCase();
    const isMobile = ua.includes("mobile") || ua.includes("android") || ua.includes("iphone");
    if (ua.includes("chrome")) return { label: `Chrome${isMobile ? " (Mobil)" : ""}`, icon: isMobile ? "mobile" : "desktop" };
    if (ua.includes("firefox")) return { label: `Firefox${isMobile ? " (Mobil)" : ""}`, icon: isMobile ? "mobile" : "desktop" };
    if (ua.includes("safari")) return { label: `Safari${isMobile ? " (Mobil)" : ""}`, icon: isMobile ? "mobile" : "desktop" };
    return { label: isMobile ? "Mobil Tarayıcı" : "Masaüstü Tarayıcı", icon: isMobile ? "mobile" : "desktop" };
  }

  async function revokeSession(sessionId: string) {
    setRevoking(sessionId);
    await fetch("/api/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    await loadSessions();
    setRevoking(null);
  }

  async function revokeAllSessions() {
    setRevoking("all");
    await fetch("/api/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    await signOut({ callbackUrl: "/login" });
  }

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

      {/* ACTIVE SESSIONS */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text">Aktif Oturumlar</p>
            <p className="text-xs text-text-muted mt-0.5">Hesabına bağlı cihazlar</p>
          </div>
          <button
            onClick={revokeAllSessions}
            disabled={revoking === "all"}
            className="flex items-center gap-1.5 rounded-lg bg-red-600/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-600/20 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Tüm Cihazlardan Çıkış
          </button>
        </div>

        {sessionsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-2" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-text-muted">Aktif oturum bulunamadı.</p>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((s, idx) => {
              const device = parseDevice(s.userAgent);
              const isFirst = idx === 0;
              return (
                <div key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-text-muted shrink-0">
                    {device.icon === "mobile"
                      ? <Smartphone className="h-4 w-4" />
                      : <Monitor className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text truncate">
                      {device.label}
                      {isFirst && <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent font-semibold">Bu cihaz</span>}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {s.ipAddress ?? "IP bilinmiyor"} · Son aktif: {new Date(s.lastActiveAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  {!isFirst && (
                    <button
                      onClick={() => revokeSession(s.id)}
                      disabled={revoking === s.id}
                      className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-600/10 disabled:opacity-50"
                    >
                      Çıkış Yap
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
