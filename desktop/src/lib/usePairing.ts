import { useCallback, useEffect, useState } from "react";
import { readDeviceStatus } from "./device";
import { clearPairing, hasCore, pairDevice, readPairing, type Pairing } from "./pairing";

export type PairingState =
  /** Asking the core, on the way in. */
  | { status: "loading" }
  /** No core to ask — the browser preview. Not the same as "not paired". */
  | { status: "unavailable" }
  | { status: "unpaired"; error: string | null }
  /** A token is in the keychain, but the website could not be reached to confirm it. */
  | { status: "offline"; error: string }
  | { status: "pairing" }
  | { status: "paired"; pairing: Pairing };

export function usePairing(): {
  state: PairingState;
  pair: (code: string) => Promise<void>;
  forget: () => Promise<void>;
  /** Ask again — the button an offline app offers instead of a pairing form. */
  retry: () => Promise<void>;
} {
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
      setState(
        local?.paired
          ? { status: "offline", error: message }
          : { status: "unpaired", error: message }
      );
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
