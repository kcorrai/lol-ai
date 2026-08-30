import { useCallback, useEffect, useState } from "react";
import { readDeviceStatus, type DeviceStatus } from "./device";
import {
  cancelPairing,
  clearPairing,
  hasCore,
  pairDevice,
  pollPairing,
  readPairing,
  startPairing,
  type Pairing,
} from "./pairing";

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
  /** A code is being exchanged. The fallback path (ADR-048), kept for when it is wanted. */
  | { status: "pairing" }
  /** Asking the website to open a request, before there is anywhere to send the player. */
  | { status: "opening" }
  /** The browser is open on the approval page and this window is asking whether yes yet. */
  | { status: "approving"; expiresAt: string }
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
/**
 * How often this window asks whether the request has been approved.
 *
 * Two seconds is chosen against the person, not the server: it is the longest gap that
 * still feels immediate when they come back from the browser having pressed Approve. The
 * claim endpoint is rate limited well above the three hundred attempts ten minutes of this
 * would make.
 */
export const POLL_INTERVAL_MS = 2000;

export interface PairingHandle {
  state: PairingState;
  /** Open a request and send the browser to approve it. The path with no typing. */
  begin: () => Promise<void>;
  /** Stop waiting on a request. Nothing was granted, so nothing is revoked. */
  cancel: () => Promise<void>;
  pair: (code: string) => Promise<void>;
  forget: () => Promise<void>;
  /** Ask again — the button an offline app offers instead of a pairing form. */
  retry: () => Promise<void>;
}

/**
 * Whether the window should draw setup instead of itself.
 *
 * Only the two states that mean "this machine holds no token and could get one". The other
 * non-paired states are deliberately not here: `unavailable` is the browser preview, which
 * has no credential store to pair against and would be trapped on a screen it cannot
 * finish; `offline` and `unknown` belong to a machine that has a token, or cannot be asked
 * whether it does, and sending either of those to a pairing form asks the player to fix
 * something that is not broken.
 */
export function needsSetup(status: PairingState["status"]): boolean {
  return (
    status === "unpaired" || status === "pairing" || status === "opening" || status === "approving"
  );
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

  const begin = useCallback(async () => {
    setState({ status: "opening" });
    try {
      const opened = await startPairing();
      setState({ status: "approving", expiresAt: opened.expiresAt });
    } catch (err) {
      setState({
        status: "unpaired",
        error: err instanceof Error ? err.message : "Could not start pairing. Try again.",
      });
    }
  }, []);

  const cancel = useCallback(async () => {
    await cancelPairing().catch(() => undefined);
    setState({ status: "unpaired", error: null });
  }, []);

  /**
   * Ask, while there is something to ask about.
   *
   * Driven from here rather than from a command that waits for the answer: a ten-minute
   * await in the core holds a thread and cannot be told the player closed the window. The
   * effect keys on the status alone, so it starts once when the wait begins and is torn
   * down the moment the state moves on — including the move this very effect causes.
   */
  useEffect(() => {
    if (state.status !== "approving") return;

    let stopped = false;
    const ask = async (): Promise<void> => {
      try {
        const progress = await pollPairing();
        if (stopped) return;
        if (progress.status === "paired") {
          setState({ status: "paired", pairing: progress.pairing });
        } else if (progress.status === "idle") {
          // The core is not waiting on anything — this window was reloaded and the
          // request went with it. Saying so beats asking for ever.
          setState({ status: "unpaired", error: null });
        }
      } catch (err) {
        if (stopped) return;
        setState({
          status: "unpaired",
          error: err instanceof Error ? err.message : "Pairing could not be completed.",
        });
      }
    };

    const id = setInterval(() => void ask(), POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [state.status]);

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

  return { state, begin, cancel, pair, forget, retry: refresh };
}
