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
        <h1 className="font-display text-2xl font-bold text-text">Notification Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage browser push notifications.
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
            <p className="text-sm font-semibold text-text">Push Notifications</p>
            <p className="mt-0.5 text-xs text-text-muted">
              Receive browser notifications when your report is ready, you rank up, or a tilt warning is triggered.
            </p>
          </div>
        </div>

        {isUnsupported && (
          <p className="rounded-lg bg-surface-2 px-4 py-3 text-sm text-text-muted">
            Your browser doesn&apos;t support push notifications or hasn&apos;t granted permission.
          </p>
        )}

        {isDenied && (
          <p className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning">
            Notifications are blocked. Allow notifications for this site in your browser settings.
          </p>
        )}

        {!isUnsupported && !isDenied && (
          <div className="flex items-center gap-3">
            <button
              onClick={isEnabled ? unsubscribe : subscribe}
              disabled={isLoading}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                isEnabled
                  ? "bg-surface-2 text-text hover:bg-danger/10 hover:text-danger"
                  : "bg-accent text-background hover:bg-accent/90"
              }`}
            >
              {isEnabled ? (
                <>
                  <BellOff className="h-4 w-4" />
                  {isLoading ? "Processing…" : "Disable Notifications"}
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  {isLoading ? "Processing…" : "Enable Notifications"}
                </>
              )}
            </button>

            {isEnabled && (
              <span className="flex items-center gap-1.5 text-xs text-accent">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Active
              </span>
            )}
          </div>
        )}

        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium text-text-muted mb-2">Notification types:</p>
          <ul className="space-y-1 text-xs text-text-muted">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Coaching report completed
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Rank change (up / down)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Tilt warning (losing streak)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
