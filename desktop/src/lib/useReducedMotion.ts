import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  // No `matchMedia` outside a browser, and this app's tests run in node. A window that
  // cannot be asked is one that has not asked for less movement.
  const media = globalThis.matchMedia?.(QUERY);
  if (!media) return () => {};

  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function read(): boolean {
  return globalThis.matchMedia?.(QUERY).matches ?? false;
}

/**
 * Whether this machine has asked for less movement.
 *
 * The stylesheet already answers this for animations and transitions, which covers almost
 * everything this window does. It does not cover the one thing CSS cannot reach: a `<video>`
 * that plays by itself. An autoplaying, looping clip is exactly the kind of motion the
 * preference exists to stop, and it keeps moving however hard the stylesheet tries.
 *
 * `useSyncExternalStore` rather than an effect, so the first render already has the answer.
 * Reading it a frame late means the clip starts playing and is then stopped, which is worse
 * than not starting.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
