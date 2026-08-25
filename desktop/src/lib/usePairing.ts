import { useCallback, useEffect, useState } from "react";
import { readDeviceStatus, type DeviceStatus } from "./device";
import { clearPairing, hasCore, pairDevice, readPairing, type Pairing } from "./pairing";

export type PairingState =
  /** Asking the core, on the way in. */
  | { status: "loading" }
  /** No core to ask — the browser preview. Not the same as "not paired". */
  | { status: "unavailable" }
  | { status: "unpaired"; error: string | null }
  /** A token is in the keychain, but the website could not be reached to confirm it. */
  | { status: "offline"; error: string }
  /**
   * The credential store could not be asked, so whether there is a token is not known.
   *
   * The second state on this list that exists to avoid answering a question nobody could
   * answer — `unavailable` is the other, for the browser preview. Different cause, same
   * rule: an app that does not know must not say no.
   */
  | { status: "unknown"; error: string }
  | { status: "pairing" }
  | { status: "paired"; pairing: Pairing };

/**
 * What the app is, given that the website could not be reached and what the credential
 * store said about it.
 *
 * A function rather than a branch inside the effect because this suite runs in node with
 * no DOM, so the hook cannot be rendered — the same reason `parseCollapsed` is a function.
 * It is also the decision that was wrong, which makes it the one worth pinning.
 *
 * `null` means the core itself could not be asked, which is not an answer either.
 */
export function pairingStateFor(local: DeviceStatus | null, message: string): PairingState {
  switch (local?.status) {
    // A token is here and the website is out of reach. A companion opened on a train is
    // not a companion that has been cut off.
    case "paired":
      return { status: "offline", error: message };
    // The store answered, and answered no.
    case "not-paired":
      return { status: "unpaired", error: message };
    // The store refused, or there was no core to put the question to. Two ways of not
    // knowing, and neither of them is "no".
    case "unknown":
      return { status: "unknown", error: local.reason };
    default:
      return { status: "unknown", error: message };
  }
}

/**
 * Named because two places read it now — the Pairing screen and the account chip in the
 * top bar — and they have to be the same one. Called once, in `App`, and handed down: two
 * copies of this hook would make two `device_account` calls on the way in and, worse,
 * leave the chip naming an account the player had just forgotten.
 */
export interface PairingHandle {
  state: PairingState;
  pair: (code: string) => Promise<void>;
  forget: () => Promise<void>;
  /** Ask again — the button an offline app offers instead of a pairing form. */
  retry: () => Promise<void>;
}

export function usePairing(): PairingHandle {
  const [state, setState] = useState<PairingState>({ status: "loading" });

  const refresh = useCallback(async () => {
    // Asked before the call, not inferred from its answer: `null` from a real core means
    // unpaired, and `null` from no core means nobody was asked. Reporting the second as the
    // first would be a guess dressed as a fact.
    if (!hasCore()) {
      setState({ status: "unavailable" });
      return;
    }

    try {
      const pairing = await readPairing();
      if (pairing) setState({ status: "paired", pairing });
      else setState({ status: "unpaired", error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // The website was unreachable, which is not the same as being unpaired — and the
      // credential store can still say which. A companion opened on a train should not be
      // told to pair again; it should be told the website is out of reach.
      const local = await readDeviceStatus().catch(() => null);
      setState(pairingStateFor(local, message));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pair = useCallback(async (code: string) => {
    setState({ status: "pairing" });
    try {
      setState({ status: "paired", pairing: await pairDevice(code) });
    } catch (err) {
      setState({
        status: "unpaired",
        error: err instanceof Error ? err.message : "Pairing failed. Try again.",
      });
    }
  }, []);

  const forget = useCallback(async () => {
    await clearPairing();
    setState({ status: "unpaired", error: null });
  }, []);

  return { state, pair, forget, retry: refresh };
}
