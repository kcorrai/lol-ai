import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DraftSide, TeamNumber } from "@/domains/draft";
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
 * Everything a drafter can do. Each call writes the server's answer straight
 * back into the query cache, so the board never waits for a poll to catch up
 * with the caller's own action.
 */
export function useDraftActions(code: string, gameNumber: number, token: string | null): Actions {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = useCallback(
    (path: string, body: Record<string, unknown>) => {
      if (!token) return;
      setPending(true);
      setError(null);
      apiFetch<DraftView>(`/api/draft/${code}/${path}`, {
        method: "POST",
        body: JSON.stringify({ token, gameNumber, ...body }),
      })
        .then((view) => {
          queryClient.setQueryData(draftQueryKey(code, gameNumber, token), view);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setPending(false));
    },
    [code, gameNumber, queryClient, token]
  );

  return {
    lock: useCallback((championKey) => post("action", { championKey }), [post]),
    setReady: useCallback((ready) => post("ready", { ready }), [post]),
    undo: useCallback(() => post("undo", {}), [post]),
    setWinner: useCallback((winnerSide) => post("result", { winnerSide }), [post]),
    setBlueTeam: useCallback((blueTeam) => post("side", { blueTeam }), [post]),
    pending,
    error,
  };
}
