import { useCallback, useEffect, useRef, useState } from "react";
import { isNewMatch, readLatestMatch, type ArchiveRow } from "./lastMatch";
import type { LiveRead } from "./liveClient/client";
import type { AllGameData } from "./liveClient/schema";
import { hasCore, readPairing } from "./pairing";
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
 * The finished game itself, once the website has pulled it.
 *
 * Separate from {@link PostGameState} because the two answer different questions and fail
 * separately: one is whether the website was told, the other is whether the match has landed.
 * A pull that was accepted and then never appeared leaves the panel saying what it always
 * said, which is the truth.
 */
export type LastMatchState =
  | { status: "idle" }
  /** Reported, and the archive is being watched for it. */
  | { status: "waiting" }
  | { status: "ready"; row: ArchiveRow }
  /** Watched for as long as it is worth watching, and it did not arrive. */
  | { status: "gave-up" };

/**
 * How long the archive is watched for, and how often.
 *
 * Bounded on purpose. The pull is a request to Riot on the website's side and it usually
 * lands in seconds, but it can fail there in ways this window is never told about — so this
 * stops rather than asking forever behind a panel nobody is looking at any more. A minute is
 * long enough for the ordinary case and short enough that a failed sync stops costing
 * requests while the player is already in their next queue.
 */
export const WATCH_ATTEMPTS = 12;
export const WATCH_INTERVAL_MS = 5_000;

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
  /** The game that just ended, once the website has it. */
  lastMatch: LastMatchState;
  /** Opens the match list in the player's own browser. */
  open: () => Promise<void>;
  openError: string | null;
} {
  const [state, setState] = useState<PostGameState>({ status: "idle" });
  const [lastMatch, setLastMatch] = useState<LastMatchState>({ status: "idle" });
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
        // Only a pull that was actually accepted is worth watching for. "No Riot account"
        // means there is nothing to arrive, and the panel says so instead.
        if (sync && sync.status !== "no_riot_account") setLastMatch({ status: "waiting" });
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

  /**
   * Watches the archive until the finished game turns up in it.
   *
   * The top row is read once before the wait begins, and the wait ends when the top row is a
   * different match. Comparing against what was there is what tells the new game apart from
   * the one before it — the archive has no field that says "this one is new", and the clock
   * on this machine is not the one the record was written by.
   *
   * Runs on a timer rather than a loop with a sleep so React can stop it: the player
   * navigating away from this screen mid-wait should stop the requests, not finish them.
   */
  useEffect(() => {
    if (lastMatch.status !== "waiting") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    /** One pass. `before` is what was on top when the game ended. */
    const look = async (riotAccountId: string, before: string | null, attempt: number): Promise<void> => {
      const row = await readLatestMatch(riotAccountId);
      if (cancelled) return;

      if (row && isNewMatch(before, row)) {
        setLastMatch({ status: "ready", row });
        return;
      }
      if (attempt >= WATCH_ATTEMPTS) {
        setLastMatch({ status: "gave-up" });
        return;
      }
      timer = setTimeout(() => void look(riotAccountId, before, attempt + 1), WATCH_INTERVAL_MS);
    };

    const watch = async (): Promise<void> => {
      // Read once rather than per attempt: neither the account nor the row that was on top
      // when the game ended changes while this waits.
      const pairing = await readPairing();
      const riotAccountId = pairing?.account.riotAccount?.id ?? null;
      if (cancelled) return;
      // Nothing to look in, so nothing to wait for. The panel keeps the sentence it had.
      if (!riotAccountId) {
        setLastMatch({ status: "gave-up" });
        return;
      }

      const before = (await readLatestMatch(riotAccountId))?.riotMatchId ?? null;
      if (cancelled) return;

      timer = setTimeout(() => void look(riotAccountId, before, 1), WATCH_INTERVAL_MS);
    };

    void watch();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [lastMatch.status]);

  const open = useCallback(async () => {
    setOpenError(null);
    try {
      await openReport();
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : "Could not open your browser.");
    }
  }, []);

  return { state, lastMatch, open, openError };
}
