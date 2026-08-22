import { useCallback, useEffect, useState } from "react";
import { clearDeviceToken, readDeviceStatus, type DeviceStatus } from "./device";

/**
 * `null` means the question cannot be asked here — the browser preview has no credential
 * store to ask. That is distinct from a confident "not paired", and the UI says so.
 */
export function useDeviceStatus(): {
  status: DeviceStatus | null;
  forget: () => Promise<void>;
} {
  const [status, setStatus] = useState<DeviceStatus | null>(null);

  const refresh = useCallback(async () => {
    setStatus(await readDeviceStatus());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const forget = useCallback(async () => {
    await clearDeviceToken();
    await refresh();
  }, [refresh]);

  return { status, forget };
}
