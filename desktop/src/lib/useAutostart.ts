import { useCallback, useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

export type AutostartState =
  /** Asking the operating system, on the way in. */
  | { status: "loading" }
  /** No core to ask — the browser preview has no start-up list to be on. */
  | { status: "unavailable" }
  | { status: "ready"; enabled: boolean }
  /** The OS refused. Said out loud rather than silently leaving the switch where it was. */
  | { status: "error"; message: string; enabled: boolean };

function message(err: unknown): string {
  return err instanceof Error ? err.message : "Your system would not change this setting.";
}

/**
 * Whether this app launches with the machine, and the switch that changes it.
 *
 * Off until the player asks for it. Putting itself in somebody's start-up list uninvited
 * is exactly what the reviews of the competitors complain about, and a companion that
 * has to earn its place there is one that can be trusted with the rest.
 *
 * The operating system owns this fact, not this app — so it is read back from the OS
 * rather than remembered, and a refused write leaves the switch showing what is actually
 * true instead of what was asked for.
 */
export function useAutostart(): {
  state: AutostartState;
  toggle: () => Promise<void>;
} {
  const [state, setState] = useState<AutostartState>({ status: "loading" });

  useEffect(() => {
    // Asked before the call rather than inferred from its answer: a browser preview has
    // no start-up list at all, which is not the same as being absent from one.
    if (!isTauri()) {
      setState({ status: "unavailable" });
      return;
    }

    let cancelled = false;
    isEnabled()
      .then((enabled) => {
        if (!cancelled) setState({ status: "ready", enabled });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: "error", message: message(err), enabled: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(async () => {
    if (state.status !== "ready" && state.status !== "error") return;

    const wanted = !state.enabled;
    try {
      if (wanted) await enable();
      else await disable();
      // Read back rather than assumed: the write can be accepted and still not take, and
      // a switch that lies about the start-up list is worse than one that will not move.
      setState({ status: "ready", enabled: await isEnabled() });
    } catch (err) {
      setState({ status: "error", message: message(err), enabled: state.enabled });
    }
  }, [state]);

  return { state, toggle };
}
