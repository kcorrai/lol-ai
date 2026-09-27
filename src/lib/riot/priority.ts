import { AsyncLocalStorage } from "node:async_hooks";

// Who is waiting on a Riot call (ADR-062).
//
// A visitor opening a profile is waiting on the answer; a nightly rank sweep or a queued match
// sync is not. Both spend the same per-region budget, and on a personal key that budget is ninety
// requests every two minutes — so a sweep left alone can take all of it and turn every profile
// lookup into "Riot is busy" for as long as it runs.
//
// The priority is carried by the async context rather than passed down, because the calls sit
// several services below the entry point and every one of those services is shared with
// foreground paths. It is set once, where background work enters: the Inngest handler and the
// crons that reach Riot.

export type RiotPriority = "foreground" | "background";

const context = new AsyncLocalStorage<RiotPriority>();

/** Run `fn` with every Riot call under it counted as background work. */
export function runAsBackground<T>(fn: () => T): T {
  return context.run("background", fn);
}

export function currentPriority(): RiotPriority {
  return context.getStore() ?? "foreground";
}
