import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch, FetchError } from "@/lib/api/fetcher";
import { applyAction, applyReady, applyUndo } from "@/domains/draft";
import type { DraftSide, TeamNumber, TransitionResult } from "@/domains/draft";
import { draftQueryKey, type DraftView } from "./useDraftSync";

interface Actions {
  lock: (championKey: string | null) => void;
  setReady: (ready: boolean) => void;
  undo: () => void;
  setWinner: (side: DraftSide) => void;
  setBlueTeam: (team: TeamNumber) => void;
  pending: boolean;
  error: string | null;
}

/**
 * Everything a drafter can do, echoed locally before the request lands.
 *
 * The echo runs the *same* engine reducer the server will run (ADR-016), so the
 * acting player sees their pick immediately and the other side sees it within a
 * poll. When the response arrives it replaces the echo outright rather than
 * merging with it — the server is always right — and a rejection rolls back to
 * the state we started from.
 */
export function useDraftActions(code: string, gameNumber: number, token: string | null): Actions {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryKey = draftQueryKey(code, gameNumber, token);

  const post = useCallback(
    (path: string, body: Record<string, unknown>, rollback?: DraftView) => {
      if (!token) return;
      setPending(true);
      setError(null);

      const send = (): Promise<DraftView> =>
        apiFetch<DraftView>(`/api/draft/${code}/${path}`, {
          method: "POST",
          body: JSON.stringify({ token, gameNumber, ...body }),
        });

      // A 409 is a version conflict: our copy of the board was stale because the
      // other side wrote in the same instant. Both sides pressing Ready together
      // is the normal case, not an edge one. The server drops its cached read
      // model before answering 409 precisely so an immediate retry reads
      // Postgres — without that retry the loser of the race silently stays not
      // ready and the draft never starts.
      send()
        .catch((err: unknown) => {
          if (err instanceof FetchError && err.statusCode === 409) return send();
          throw err;
        })
        .then((view) => queryClient.setQueryData(queryKey, view))
        .catch((err: Error) => {
          if (rollback) queryClient.setQueryData(queryKey, rollback);
          setError(err.message);
        })
        .finally(() => setPending(false));
    },
    [code, gameNumber, queryClient, queryKey, token]
  );

  /** Applies a transition locally and returns the state to roll back to. */
  const echo = useCallback(
    (run: (view: DraftView, side: DraftSide) => TransitionResult): DraftView | undefined => {
      const previous = queryClient.getQueryData<DraftView>(queryKey);
      if (!previous || previous.role === "SPECTATOR") return previous;
      const result = run(previous, previous.role);
      if (result.ok && result.changed) {
        queryClient.setQueryData(queryKey, { ...previous, state: result.series });
      }
      return previous;
    },
    [queryClient, queryKey]
  );

  return {
    lock: useCallback(
      (championKey) => {
        const rollback = echo((view, side) =>
          applyAction(view.state, gameNumber, side, championKey, new Date().toISOString())
        );
        post("action", { championKey }, rollback);
      },
      [echo, gameNumber, post]
    ),

    setReady: useCallback(
      (ready) => {
        const rollback = echo((view, side) =>
          applyReady(view.state, gameNumber, side, ready, new Date().toISOString())
        );
        post("ready", { ready }, rollback);
      },
      [echo, gameNumber, post]
    ),

    undo: useCallback(() => {
      const rollback = echo((view, side) =>
        applyUndo(view.state, gameNumber, side, new Date().toISOString())
      );
      post("undo", {}, rollback);
    }, [echo, gameNumber, post]),

    // No echo on these two: neither changes the board mid-turn, so the extra
    // machinery would buy nothing but a chance to be wrong.
    setWinner: useCallback((winnerSide) => post("result", { winnerSide }), [post]),
    setBlueTeam: useCallback((blueTeam) => post("side", { blueTeam }), [post]),

    pending,
    error,
  };
}
