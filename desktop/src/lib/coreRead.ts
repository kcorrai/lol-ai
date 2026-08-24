import { hasCore } from "./pairing";

/** No core to ask — the browser preview. Not the same as not being paired. */
export type Unavailable = { status: "unavailable" };
export type Loading = { status: "loading" };
/** This machine holds no token the website still accepts. */
export type Unpaired = { status: "unpaired" };
export type Failed = { status: "error"; message: string };

/** What a read came to, before a caller turns it into its own screen state. */
export type CoreRead<T> = Unavailable | Loading | Unpaired | Failed | { status: "ok"; value: T };

/**
 * One read through the Rust core, its four failure states, and a cancel.
 *
 * Every website call this app makes goes out through the core, so every screen that makes
 * one has the same four ways of having nothing to show. This is that shape, once.
 *
 * `hasCore` is asked before the call rather than inferred from its answer: `null` from a
 * real core means unpaired, `null` from no core means nobody was asked, and reporting the
 * second as the first would be a guess dressed as a fact.
 *
 * Returns the cancel, so an effect can hand it straight back to React.
 */
export function coreRead<T>(
  read: () => Promise<T | null>,
  set: (result: CoreRead<T>) => void
): () => void {
  if (!hasCore()) {
    set({ status: "unavailable" });
    return () => {};
  }

  let cancelled = false;
  set({ status: "loading" });

  read()
    .then((value) => {
      if (cancelled) return;
      set(value ? { status: "ok", value } : { status: "unpaired" });
    })
    .catch((err: unknown) => {
      if (cancelled) return;
      set({
        status: "error",
        message: err instanceof Error ? err.message : "Could not reach LoL AI Coach.",
      });
    });

  return () => {
    cancelled = true;
  };
}
