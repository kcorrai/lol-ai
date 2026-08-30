import { useCallback, useEffect, useRef, useState } from "react";
import { readChampionList, type DesktopChampionEntry, type Lane } from "./champions";
import { coreRead, type CoreRead } from "./coreRead";
import { readLiveContext, type LiveContext, type LiveContextRequest } from "./liveContext";
import { matchupKey } from "./liveMatchup";
import { hasCore } from "./pairing";
import type { LiveContextState } from "./useLiveContext";

/**
 * A matchup read before there is a game to read it from.
 *
 * Champion select is the moment the advice is worth the most, and it is the one moment this
 * app cannot see: it is only reachable through the League Client API, which Riot does not
 * support for third-party applications and gates behind per-release approval, so ADR-038
 * ships that capability compiled out.
 *
 * What is reachable is the same reading for a matchup somebody names. `live_context` takes
 * its request from the webview and has never required a running game — it asks the website
 * what it knows about a champion, an opponent and a lane, and none of those three have to
 * have been observed. So the player picks the two champions in the twenty seconds they have,
 * and gets the panels the game screen would have shown them a minute later.
 *
 * **Nothing here is automatic, and that is the constraint rather than the shortcut.** The
 * competitors read the picks out of the client and fill this in; doing the same would mean
 * turning on the capability that is off for a reason.
 */

/** Everything the request needs that is not one of the two champions. */
export const PREGAME_MODE = "CLASSIC";

export type RosterState = CoreRead<readonly DesktopChampionEntry[]>;

export interface Pregame {
  lane: Lane;
  setLane: (lane: Lane) => void;
  /** The champions in this lane, for both pickers. */
  roster: RosterState;
  mine: string | null;
  theirs: string | null;
  setMine: (name: string | null) => void;
  setTheirs: (name: string | null) => void;
  /** Whether there is enough named for a request to mean anything. */
  canRead: boolean;
  /** True once the matchup on screen is the one that was read. */
  isCurrent: boolean;
  read: () => void;
  /** The same shape the game screen's panels take, so they render unchanged. */
  context: LiveContextState;
}

const DEFAULT_LANE: Lane = "MIDDLE";

/**
 * What the request is for the two champions currently named.
 *
 * An opponent is optional here as it is in a game: a player who knows what they are playing
 * and not yet who into still gets the build, the skill order and their own record on the
 * champion. Half an answer now is worth more than a whole one after the timer.
 */
export function pregameRequest(
  mine: string | null,
  theirs: string | null,
  lane: Lane
): LiveContextRequest | null {
  if (!mine) return null;
  return {
    championName: mine,
    opponentChampionName: theirs,
    position: lane,
    gameMode: PREGAME_MODE,
  };
}

export function usePregame(): Pregame {
  const [lane, setLaneState] = useState<Lane>(DEFAULT_LANE);
  const [mine, setMine] = useState<string | null>(null);
  const [theirs, setTheirs] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterState>({ status: "loading" });
  const [context, setContext] = useState<LiveContextState>({ status: "idle" });
  /** Which matchup the panels on screen belong to, so a changed picker can say they are stale. */
  const [shown, setShown] = useState<string | null>(null);

  // Cached for the life of the window, like the champion browser's: these answers change once
  // a patch, and a player comparing two lanes should not pay for the same request each time.
  const lists = useRef(new Map<Lane, readonly DesktopChampionEntry[]>());
  // The website is asked once per matchup and never again, which is what keeps a screen with
  // two pickers on it inside a rate limit sized for games.
  const answers = useRef(new Map<string, LiveContext>());

  useEffect(() => {
    const cached = lists.current.get(lane);
    if (cached) {
      setRoster({ status: "ok", value: cached });
      return;
    }
    return coreRead(
      () => readChampionList(lane),
      (result) => {
        if (result.status === "ok") {
          lists.current.set(lane, result.value.entries);
          setRoster({ status: "ok", value: result.value.entries });
        } else {
          setRoster(result);
        }
      }
    );
  }, [lane]);

  const request = pregameRequest(mine, theirs, lane);
  const key = matchupKey(request);

  const read = useCallback(() => {
    if (!request || !key) return;

    // Answered from the map rather than the website when the player has already asked. Going
    // back to a matchup they looked at a minute ago is exactly what a picker invites.
    const remembered = answers.current.get(key);
    if (remembered) {
      setContext({ status: "ready", context: remembered });
      setShown(key);
      return;
    }

    // Asked before the call rather than inferred from its answer: `null` from a real core
    // means unpaired, and `null` from no core means nobody was asked.
    if (!hasCore()) {
      setContext({ status: "unavailable" });
      setShown(key);
      return;
    }

    setContext({ status: "loading" });
    setShown(key);

    readLiveContext(request)
      .then((answer) => {
        if (!answer) {
          setContext({ status: "unpaired" });
          return;
        }
        answers.current.set(key, answer);
        setContext({ status: "ready", context: answer });
      })
      .catch((err: unknown) => {
        setContext({
          status: "error",
          message: err instanceof Error ? err.message : "Could not reach LoL AI Coach.",
        });
      });
  }, [request, key]);

  /** A lane change is a different list, so neither champion is still a valid pick in it. */
  const setLane = useCallback((next: Lane) => {
    setLaneState(next);
    setMine(null);
    setTheirs(null);
  }, []);

  return {
    lane,
    setLane,
    roster,
    mine,
    theirs,
    setMine,
    setTheirs,
    canRead: request !== null,
    isCurrent: key !== null && key === shown,
    read,
    context,
  };
}
