import { useCallback, useEffect, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import {
  DEFAULT_DRAWING,
  readDrawing,
  withPanel,
  writeDrawing,
  type OverlayDrawing,
  type OverlayPanel,
} from "./overlaySettings";

/**
 * The overlay's settings, in the two halves that own them.
 *
 * {@link useOverlayDrawing} is the webview's half — which panels, how opaque — and is read
 * by both windows. {@link useOverlayPlacement} is the core's half: the shortcut the operating
 * system registers and the screen the window is put on. Neither is derived from the other and
 * they are deliberately not merged; a shortcut that failed to register is a different kind of
 * failure from a panel that will not save, and the Settings screen says so differently.
 */

/** Where the overlay is, as the core holds it. Mirrors `settings::OverlaySettings`. */
export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface OverlayPlacement {
  shortcut: string;
  monitor: string | null;
  corner: Corner;
  dx: number;
  dy: number;
}

/** One attached screen. Mirrors `commands::MonitorInfo`. */
export interface MonitorInfo {
  name: string | null;
  width: number;
  height: number;
  primary: boolean;
}

export type PlacementState =
  | { status: "loading" }
  /** No core to ask — the browser preview has no window to place and no shortcut to register. */
  | { status: "unavailable" }
  /** The core was there and would not answer. Nothing to draw controls from. */
  | { status: "unreadable"; message: string }
  | { status: "ready"; placement: OverlayPlacement; monitors: MonitorInfo[] }
  /** Carries the placement it still has, so the controls keep showing what is true. */
  | { status: "error"; message: string; placement: OverlayPlacement; monitors: MonitorInfo[] };

function message(err: unknown): string {
  return err instanceof Error ? err.message : "This machine would not change that setting.";
}

/**
 * Which panels the overlay draws, and how solid they are.
 *
 * The `storage` event is what lets the overlay follow a switch flicked in the main window
 * while a game is running. It fires in every *other* document on the origin, so the window
 * doing the writing updates from its own state and the other one hears about it — which is
 * why the setter writes and sets rather than relying on the event to come back round.
 *
 * A browser that does not deliver the event costs the overlay nothing worse than a stale
 * panel list until it is next opened. Nothing here fails loudly, because none of it is worth
 * a message over a running game.
 */
export function useOverlayDrawing(): {
  drawing: OverlayDrawing;
  togglePanel: (panel: OverlayPanel, shown: boolean) => void;
  setOpacity: (opacity: number) => void;
} {
  const [drawing, setDrawing] = useState<OverlayDrawing>(DEFAULT_DRAWING);

  // Read in an effect rather than as the initial state: the overlay window mounts this too,
  // and reading storage during render is work done before the window is on screen.
  useEffect(() => {
    setDrawing(readDrawing());

    const onStorage = (): void => setDrawing(readDrawing());
    globalThis.addEventListener?.("storage", onStorage);
    return () => globalThis.removeEventListener?.("storage", onStorage);
  }, []);

  // Written inside the updater rather than beside it: both controls change one field of a
  // value the other also owns, and reading `drawing` from the closure would let a quick
  // second click write back what the first one replaced.
  return {
    drawing,
    togglePanel: useCallback((panel: OverlayPanel, shown: boolean) => {
      setDrawing((current) => {
        const next = withPanel(current, panel, shown);
        writeDrawing(next);
        return next;
      });
    }, []),
    setOpacity: useCallback((opacity: number) => {
      setDrawing((current) => {
        const next = { ...current, opacity };
        writeDrawing(next);
        return next;
      });
    }, []),
  };
}

/**
 * The shortcut and the screen, read from the core and written back to it.
 *
 * Both writes read the answer back rather than assuming it, the way `useAutostart` does with
 * the start-up list: the operating system can refuse a shortcut that something else already
 * holds, and a control that claims a binding it did not get is worse than one that says it
 * failed.
 */
export function useOverlayPlacement(): {
  state: PlacementState;
  setShortcut: (accelerator: string) => Promise<void>;
  setPosition: (position: Omit<OverlayPlacement, "shortcut">) => Promise<void>;
} {
  const [state, setState] = useState<PlacementState>({ status: "loading" });

  useEffect(() => {
    // Asked before the call rather than inferred from its answer, as everywhere else the core
    // is used: a browser preview has no window to place at all, which is not the same as a
    // placement that could not be read.
    if (!isTauri()) {
      setState({ status: "unavailable" });
      return;
    }

    let cancelled = false;
    Promise.all([
      invoke<OverlayPlacement>("overlay_settings"),
      invoke<MonitorInfo[]>("list_monitors"),
    ])
      .then(([placement, monitors]) => {
        if (!cancelled) setState({ status: "ready", placement, monitors });
      })
      .catch((err: unknown) => {
        // With no placement to fall back on there is nothing for the controls to show. Said
        // as its own state rather than folded into "unavailable": one of them means there is
        // no window to place and the other means there is one and it would not answer, and
        // only the second is something the player might do anything about.
        if (!cancelled) setState({ status: "unreadable", message: message(err) });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Runs a write, then re-reads what the core actually holds. */
  const apply = useCallback(
    async (write: () => Promise<void>): Promise<void> => {
      if (state.status !== "ready" && state.status !== "error") return;
      const { placement, monitors } = state;

      try {
        await write();
        const settled = await invoke<OverlayPlacement>("overlay_settings");
        setState({ status: "ready", placement: settled, monitors });
      } catch (err) {
        // The placement is left as it was, which is what the core still holds: both writes
        // apply their change only once the operating system has accepted it.
        setState({ status: "error", message: message(err), placement, monitors });
      }
    },
    [state]
  );

  return {
    state,
    setShortcut: useCallback(
      (accelerator: string) => apply(() => invoke("set_overlay_shortcut", { accelerator })),
      [apply]
    ),
    setPosition: useCallback(
      (position: Omit<OverlayPlacement, "shortcut">) =>
        apply(() => invoke("set_overlay_position", position)),
      [apply]
    ),
  };
}
