"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { Monitor, Smartphone, LogOut } from "lucide-react";

interface UserSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
}

function parseDevice(userAgent: string | null): { label: string; icon: "desktop" | "mobile" } {
  if (!userAgent) return { label: "Unknown Device", icon: "desktop" };
  const ua = userAgent.toLowerCase();
  const isMobile = ua.includes("mobile") || ua.includes("android") || ua.includes("iphone");
  if (ua.includes("chrome"))
    return { label: `Chrome${isMobile ? " (Mobile)" : ""}`, icon: isMobile ? "mobile" : "desktop" };
  if (ua.includes("firefox"))
    return {
      label: `Firefox${isMobile ? " (Mobile)" : ""}`,
      icon: isMobile ? "mobile" : "desktop",
    };
  if (ua.includes("safari"))
    return { label: `Safari${isMobile ? " (Mobile)" : ""}`, icon: isMobile ? "mobile" : "desktop" };
  return {
    label: isMobile ? "Mobile Browser" : "Desktop Browser",
    icon: isMobile ? "mobile" : "desktop",
  };
}

export function ActiveSessionsList() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions");
      const json = (await res.json()) as { data: UserSession[] };
      setSessions(json.data ?? []);
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

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
    await fetch("/api/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text">Active Sessions</p>
          <p className="mt-0.5 text-xs text-text-muted">Devices logged into your account</p>
        </div>
        <button
          onClick={revokeAllSessions}
          disabled={revoking === "all"}
          className="flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/20 disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log Out of All Devices
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-xs text-text-muted">No active sessions found.</p>
      ) : (
        <div className="divide-y divide-border">
          {sessions.map((s, idx) => {
            const device = parseDevice(s.userAgent);
            const isFirst = idx === 0;
            return (
              <div key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-muted">
                  {device.icon === "mobile" ? (
                    <Smartphone className="h-4 w-4" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text">
                    {device.label}
                    {isFirst && (
                      <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-text-muted">
                    {s.ipAddress ?? "IP unknown"} · Last active:{" "}
                    {new Date(s.lastActiveAt).toLocaleDateString("en-US")}
                  </p>
                </div>
                {!isFirst && (
                  <button
                    onClick={() => revokeSession(s.id)}
                    disabled={revoking === s.id}
                    className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-danger hover:bg-danger/10 disabled:opacity-50"
                  >
                    Log Out
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
