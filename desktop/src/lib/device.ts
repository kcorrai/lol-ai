import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Whether this machine holds a device token, asked of the operating system's credential
 * store through the Rust core.
 *
 * The token itself never crosses this boundary — the core answers the question and keeps
 * the value. A webview that could read it could leak it, and there is no reason for the
 * UI to know more than paired or not.
 */
export interface DeviceStatus {
  paired: boolean;
}

export async function readDeviceStatus(): Promise<DeviceStatus | null> {
  if (!isTauri()) return null;
  return invoke<DeviceStatus>("device_status");
}

export async function clearDeviceToken(): Promise<void> {
  if (!isTauri()) return;
  await invoke("clear_device_token");
}
