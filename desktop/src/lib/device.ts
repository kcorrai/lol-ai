import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Whether this machine holds a device token, asked of the operating system's credential
 * store through the Rust core.
 *
 * The token itself never crosses this boundary — the core answers the question and keeps
 * the value. A webview that could read it could leak it, and there is no reason for the
 * UI to know more than paired or not.
 *
 * Three answers rather than two, which is the whole point of the shape. The store can say
 * "there is one", "there is none", and "I could not be asked" — and the third used to come
 * back as the second, so an app whose credential store was locked told the player that
 * nothing was stored for it while its token sat there working.
 */
export type DeviceStatus =
  | { status: "paired" }
  | { status: "not-paired" }
  /** The store's own words, because why is the only part of this a player can act on. */
  | { status: "unknown"; reason: string };

/** `null` means there is no core to ask — the browser preview, and not an answer. */
export async function readDeviceStatus(): Promise<DeviceStatus | null> {
  if (!isTauri()) return null;
  return invoke<DeviceStatus>("device_status");
}

export async function clearDeviceToken(): Promise<void> {
  if (!isTauri()) return;
  await invoke("clear_device_token");
}
