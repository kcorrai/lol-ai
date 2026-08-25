import { useEffect, useRef, type RefObject } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Keeps the overlay window as tall as what it is drawing.
 *
 * The window is 340x620 in `tauri.conf.json` and its three panels came to 1010 px against a
 * real match, so the last third of the build panel was off the bottom of it. Scrolling is
 * not the answer: the overlay never takes focus, so reaching a scrollbar means taking the
 * mouse off a running game, and the panel that gets cut is the one nobody would go looking
 * for. The window has to fit instead.
 *
 * The measuring happens here because only the document knows how tall it is; the clamping
 * happens in the core because only it knows what the monitor allows. The webview is never
 * granted `core:window:allow-set-size` for the same reason it is granted nothing else —
 * that permission would reach the main window too, and `resize_overlay` reaches exactly
 * one window by name.
 */

/**
 * Whether a new measurement is worth a round trip to the core.
 *
 * A `ResizeObserver` fires on sub-pixel changes — a font settling, a number gaining a
 * digit — and asking the operating system to resize a window for a fraction of a pixel
 * would walk the window during a match for no visible gain.
 *
 * A function rather than a branch inside the effect: this suite runs in node with no DOM,
 * so the hook cannot be rendered and the rule it turns on has to be reachable on its own.
 */
export function shouldResize(previous: number | null, next: number): boolean {
  if (next <= 0) return false;
  if (previous === null) return true;
  return Math.abs(next - previous) >= 2;
}

/** Reports the element's height to the core whenever it meaningfully changes. */
export function useOverlayFit(ref: RefObject<HTMLElement | null>): void {
  const reported = useRef<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    // No core to tell, or nothing measured yet. The browser preview at `?window=overlay`
    // is a page in a tab and has no window of its own to fit.
    if (!element || !isTauri()) return;

    const report = (height: number): void => {
      if (!shouldResize(reported.current, height)) return;
      reported.current = height;
      // Nothing is awaited and nothing is thrown: a window that would not resize is a
      // window still showing what it showed a moment ago, which is not worth interrupting
      // a match over.
      void invoke("resize_overlay", { height }).catch(() => undefined);
    };

    const observer = new ResizeObserver(([entry]) => {
      if (entry) report(entry.target.getBoundingClientRect().height);
    });
    observer.observe(element);

    // The observer delivers the first measurement itself, but only once layout settles.
    // This is the same number a moment earlier, so the window is right on the first frame
    // the player sees rather than the second.
    report(element.getBoundingClientRect().height);

    return () => observer.disconnect();
  }, [ref]);
}
