"use client";

import { useState } from "react";
import { Monitor } from "lucide-react";
import type { DesktopDeviceSummary } from "@/domains/desktop/contract";
import { useDesktopDevices, useRevokeDesktopDevice } from "@/hooks/useDesktopDevices";

const PLATFORM_LABELS: Record<string, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

function describe(device: DesktopDeviceSummary): string {
  const platform = PLATFORM_LABELS[device.platform] ?? device.platform;
  const version = device.appVersion ? ` · v${device.appVersion}` : "";

  if (device.revokedAt) {
    return `${platform}${version} · Revoked ${new Date(device.revokedAt).toLocaleDateString("en-US")}`;
  }
  // A machine that has never come back has only ever spoken once — during the
  // pairing exchange itself — so saying "never" would be wrong.
  const seen = device.lastSeenAt
    ? `Last seen ${new Date(device.lastSeenAt).toLocaleDateString("en-US")}`
    : "Not seen since pairing";
  return `${platform}${version} · ${seen}`;
}

export function DeviceList(): React.ReactElement {
  const { data: devices, isLoading, error } = useDesktopDevices();
  const revoke = useRevokeDesktopDevice();
  const [pending, setPending] = useState<string | null>(null);

  function handleRevoke(deviceId: string): void {
    setPending(deviceId);
    revoke.mutate(deviceId, { onSettled: () => setPending(null) });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div>
        <p className="text-sm font-semibold text-text">Paired devices</p>
        <p className="mt-0.5 text-xs text-text-muted">
          Revoking cuts a machine off immediately. Its copy of the app will ask to be paired again.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : error ? (
        <p className="text-xs text-danger">
          {error instanceof Error ? error.message : "Could not load your devices"}
        </p>
      ) : !devices?.length ? (
        <p className="text-xs text-text-muted">No device has been paired with this account yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {devices.map((device) => (
            <div key={device.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 ${
                  device.revokedAt ? "text-text-muted/50" : "text-text-muted"
                }`}
              >
                <Monitor className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-xs font-medium ${
                    device.revokedAt ? "text-text-muted" : "text-text"
                  }`}
                >
                  {device.label}
                </p>
                <p className="truncate text-[11px] text-text-muted">{describe(device)}</p>
              </div>
              {!device.revokedAt && (
                <button
                  onClick={() => handleRevoke(device.id)}
                  disabled={pending === device.id}
                  className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-danger hover:bg-danger/10 disabled:opacity-50"
                >
                  {pending === device.id ? "Revoking…" : "Revoke"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {revoke.isError && (
        <p className="text-xs text-danger">
          {revoke.error instanceof Error ? revoke.error.message : "Could not revoke that device"}
        </p>
      )}
    </div>
  );
}
