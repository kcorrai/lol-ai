"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function NotificationsSettingsPage() {
  const { state, subscribe, unsubscribe } = usePushNotifications();

  const isEnabled = state === "granted";
  const isLoading = state === "loading";
  const isUnsupported = state === "unsupported";
  const isDenied = state === "denied";

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Bildirim Ayarları</h1>
        <p className="mt-1 text-sm text-text-muted">
          Tarayıcı push bildirimlerini yönet.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            {isEnabled ? (
              <BellRing className="h-5 w-5 text-accent" />
            ) : (
              <Bell className="h-5 w-5 text-text-muted" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text">Push Bildirimleri</p>
            <p className="mt-0.5 text-xs text-text-muted">
              Raporun hazır olduğunda, rank atladığında veya tilt uyarısı tetiklendiğinde
              tarayıcı bildirimi al.
            </p>
          </div>
        </div>

        {isUnsupported && (
          <p className="rounded-lg bg-surface-2 px-4 py-3 text-sm text-text-muted">
            Tarayıcın push bildirimleri desteklemiyor veya izin verilmedi.
          </p>
        )}

        {isDenied && (
          <p className="rounded-lg bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
            Bildirimler engellendi. Tarayıcı ayarlarından bu site için bildirimlere izin ver.
          </p>
        )}

        {!isUnsupported && !isDenied && (
          <div className="flex items-center gap-3">
            <button
              onClick={isEnabled ? unsubscribe : subscribe}
              disabled={isLoading}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                isEnabled
                  ? "bg-surface-2 text-text hover:bg-red-500/10 hover:text-red-400"
                  : "bg-accent text-background hover:bg-accent/90"
              }`}
            >
              {isEnabled ? (
                <>
                  <BellOff className="h-4 w-4" />
                  {isLoading ? "İşleniyor…" : "Bildirimleri Kapat"}
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  {isLoading ? "İşleniyor…" : "Bildirimleri Aç"}
                </>
              )}
            </button>

            {isEnabled && (
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Aktif
              </span>
            )}
          </div>
        )}

        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium text-text-muted mb-2">Bildirim türleri:</p>
          <ul className="space-y-1 text-xs text-text-muted">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Koçluk raporu tamamlandı
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Rank değişikliği (yükseldi / düştü)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Tilt uyarısı (üst üste kayıp serisi)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
