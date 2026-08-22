import { invoke, isTauri } from "@tauri-apps/api/core";
import { clearDeviceToken } from "./device";
import type { DesktopAccount, DesktopDeviceSummary } from "../../../src/domains/desktop/contract";

/**
 * Pairing, from the webview's side of the IPC boundary.
 *
 * Note what is not here: the token. The exchange happens in the Rust core, which writes it
 * straight to the operating system's credential store and hands back only the account it
 * belongs to (ADR-038). There is no call in this module that could return one, which is the
 * point — a webview that could read the token could leak it.
 */
export interface Pairing {
  device: DesktopDeviceSummary;
  account: DesktopAccount;
}

/** Thrown with the message the core produced, which is already written for the player. */
export class PairingError extends Error {}

/**
 * Whether there is a Rust core behind this webview at all.
 *
 * The browser preview has none, so it cannot pair and cannot even ask whether it is
 * paired. Callers check this first, because `null` from `readPairing` would otherwise read
 * as a confident "not paired" when the truth is that nobody was asked.
 */
export function hasCore(): boolean {
  return isTauri();
}

/** `null` means this machine holds no token the website still accepts. */
export async function readPairing(): Promise<Pairing | null> {
  if (!isTauri()) return null;
  return invoke<Pairing | null>("device_account");
}

export async function pairDevice(code: string): Promise<Pairing> {
  if (!isTauri()) {
    throw new PairingError(
      "This preview cannot pair. Run the desktop app, which has the credential store."
    );
  }

  try {
    return await invoke<Pairing>("pair_device", { code });
  } catch (err) {
    // Tauri rejects with whatever the command serialised, and AppError serialises to its
    // own message — including the website's, which is the half that tells the player what
    // to do next.
    throw new PairingError(typeof err === "string" ? err : "Pairing failed. Try again.");
  }
}

/** Forgets the token on this machine. Revoking it for real is done on the website. */
export async function clearPairing(): Promise<void> {
  await clearDeviceToken();
}
