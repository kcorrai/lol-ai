import { useEffect, useMemo, useRef, useState } from "react";
import type { LiveRead } from "./liveClient/client";
import type { AllGameData } from "./liveClient/schema";
import { readLiveContext, type LiveContext } from "./liveContext";
import { describeMatchup, matchupKey } from "./liveMatchup";
import { hasCore } from "./pairing";

export type LiveContextState =
  /** No game, or a game this app cannot see itself in. Nothing to ask about. */
  | { status: "idle" }
  /** No core to ask — the browser preview. Not the same as not paired. */
  | { status: "unavailable" }
  | { status: "loading" }
  /** This machine holds no token the website still accepts. */
  | { status: "unpaired" }
  | { status: "error"; message: string }
  | { status: "ready"; context: LiveContext };

/**
 * What the website knows about the game being polled, fetched once per matchup.
 *
 * The game is read about once a second and this answer changes when a game starts and not
 * once more, so the fetch is keyed on the matchup rather than on the poll. A forty-minute
 * match costs one request. Doing otherwise would put two thousand authenticated requests
 * through a rate limit sized for games — and would spend the player's connection during
 * the one activity where it is already busy.
 */
export function useLiveContext(read: LiveRead<AllGameData>): LiveContextState {
  const [state, setState] = useState<LiveContextState>({ status: "idle" });

  const request = useMemo(() => (read.status === "ok" ? describeMatchup(read.data) : null), [read]);
  const key = matchupKey(request);

  // The effect runs on the matchup, not on the request object, which is rebuilt every
  // poll. Held in a ref so the latest one is available without becoming a dependency.
  const latest = useRef(request);
  latest.current = request;

  useEffect(() => {
    const pending = latest.current;
    if (!key || !pending) {
      setState({ status: "idle" });
      return;
    }
    // Asked before the call rather than inferred from its answer: `null` from a real core
    // means unpaired, and `null` from no core means nobody was asked.
    if (!hasCore()) {
      setState({ status: "unavailable" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    readLiveContext(pending)
      .then((context) => {
        if (cancelled) return;
        setState(context ? { status: "ready", context } : { status: "unpaired" });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Could not reach LoL AI Coach.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return state;
}
