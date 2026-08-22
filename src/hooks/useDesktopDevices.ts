import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DesktopDeviceSummary, IssuedPairingCode } from "@/domains/desktop/contract";

// The player's side of desktop pairing (ADR-038). The app's side never comes
// through here — it talks to /api/desktop/pair from the Rust core, so the device
// token never reaches a browser at all.

const DEVICES_KEY = ["desktop-devices"];

async function extractError(res: Response, fallback: string): Promise<never> {
  const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  throw new Error(json?.error?.message ?? fallback);
}

async function fetchDevices(): Promise<DesktopDeviceSummary[]> {
  const res = await fetch("/api/desktop/devices");
  if (!res.ok) await extractError(res, "Could not load your devices");
  const json = (await res.json()) as { data: { devices: DesktopDeviceSummary[] } };
  return json.data.devices;
}

async function issueCode(): Promise<IssuedPairingCode> {
  const res = await fetch("/api/desktop/pairing-code", { method: "POST" });
  if (!res.ok) await extractError(res, "Could not generate a pairing code");
  const json = (await res.json()) as { data: IssuedPairingCode };
  return json.data;
}

async function revokeDevice(deviceId: string): Promise<void> {
  const res = await fetch(`/api/desktop/devices/${deviceId}`, { method: "DELETE" });
  if (!res.ok) await extractError(res, "Could not revoke that device");
}

export function useDesktopDevices() {
  return useQuery({ queryKey: DEVICES_KEY, queryFn: fetchDevices, staleTime: 30_000 });
}

export function useIssuePairingCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: issueCode,
    // The list is what tells the player the code worked, and the app can claim it
    // seconds after it appears on screen.
    onSuccess: () => qc.invalidateQueries({ queryKey: DEVICES_KEY }),
  });
}

export function useRevokeDesktopDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeDevice,
    onSuccess: () => qc.invalidateQueries({ queryKey: DEVICES_KEY }),
  });
}
