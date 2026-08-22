"use client";

import { DeviceList } from "./DeviceList";
import { PairingCodePanel } from "./PairingCodePanel";

export default function DesktopSettingsPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Desktop app</h1>
        <p className="mt-1 text-sm text-text-muted">
          The companion reads your live game from your own machine — something no website
          can do. Pair it here.
        </p>
      </div>

      <PairingCodePanel />
      <DeviceList />

      <p className="text-[11px] text-text-muted">
        Your password never reaches the desktop app. It holds a token for that one machine,
        kept in your operating system&apos;s credential store, and revoking the device here
        is enough to cut it off.
      </p>
    </div>
  );
}
