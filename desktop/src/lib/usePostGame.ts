import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveRead } from "./liveClient/client";
import type { AllGameData } from "./liveClient/schema";
import { hasCore } from "./pairing";
import { gameJustEnded, openReport, reportGameEnded, type PostGame } from "./postGame";

export type PostGameState =
  /** No game has ended while this window has been open. */
  | { status: "idle" }
  /** No core to tell — the browser preview. */
  | { status: "unavailable" }
  | { status: "reporting" }
  | { status: "reported"; sync: PostGame }
  /** This machine holds no token the website still accepts. */
  | { status: "unpaired" }
  | { status: "error"; message: string };

/**
 * Tells the website a game has ended, the moment it does.
 *
 * The website pulls an account when somebody opens the dashboard and the data is half an
 * hour stale, because nothing on a server knows a match is over. This window does, and the
 * whole feature is that one fact travelling in time to be useful.
 *
 * It fires on the edge and not on the state, so a finished game is reported once. The
 * panel it drives stays on screen afterwards, because the player alt-tabbing out of a
 * finished game is exactly who it is for.
 */
export function usePostGame(read: LiveRead<AllGameData>): {
  state: PostGameState;
  /** Opens the match list in the player's own browser. */
  open: () => Promise<void>;
  openError: string | null;
} {
  const [state, setState] = useState<PostGameState>({ status: "idle" });
  const [openError, setOpenError] = useState<string | null>(null);
  const previous = useRef<LiveRead<AllGameData> | null>(null);

  useEffect(() => {
    const ended = gameJustEnded(previous.current, read);
    previous.current = read;
    if (!ended) return;

    // Asked before the call rather than inferred from its answer, as everywhere else the
    // core is used: `null` from a real core means unpaired, `null` from no core means
    // nobody was asked.
    if (!hasCore()) {
      setState({ status: "unavailable" });
      return;
    }

    let cancelled = false;
    setState({ status: "reporting" });

    reportGameEnded()
      .then((sync) => {
        if (cancelled) return;
        setState(sync ? { status: "reported", sync } : { status: "unpaired" });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            err instanceof Error ? err.message : "Could not tell LoL AI Coach the game ended.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [read]);

  const open = useCallback(async () => {
    setOpenError(null);
    try {
      await openReport();
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : "Could not open your browser.");
    }
  }, []);

  return { state, open, openError };
}
