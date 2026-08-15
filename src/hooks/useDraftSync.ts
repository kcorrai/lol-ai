import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DraftSeriesState, ViewerRole } from "@/domains/draft";

export interface DraftView {
  state: DraftSeriesState;
  role: ViewerRole;
  /** The server's clock at the moment it answered. */
  serverTime: string;
}

export function draftQueryKey(code: string, gameNumber: number, token: string | null): unknown[] {
  return ["draft", code, gameNumber, token ? "drafter" : "spectator"];
}

// ADR-016: one poll per second while a draft is live, slower in the lobby, and
// nothing at all once the game is done. The countdown is never polled — it is
// derived locally from `turnStartedAt`, so this interval only has to be fast
// enough to notice that the *turn changed*.
const INTERVAL_MS = { LOBBY: 3000, IN_PROGRESS: 1000, COMPLETE: false } as const;

export interface DraftSyncResult {
  data: DraftView | undefined;
  isLoading: boolean;
  error: Error | null;
  /** Add to `Date.now()` to get the server's clock. */
  skewMs: number;
}

export function useDraftSync(
  code: string,
  gameNumber: number,
  token: string | null
): DraftSyncResult {
  const query = useQuery<DraftView>({
    queryKey: draftQueryKey(code, gameNumber, token),
    queryFn: async () => {
      const params = new URLSearchParams({ game: String(gameNumber) });
      if (token) params.set("token", token);
      const sentAt = Date.now();
      const view = await apiFetch<DraftView>(`/api/draft/${code}?${params.toString()}`);
      // Stamp the round trip so the caller can measure skew without a second request.
      return { ...view, receivedAt: sentAt } as DraftView & { receivedAt: number };
    },
    refetchInterval: (query) => {
      const phase = query.state.data?.state.games.find((g) => g.gameNumber === gameNumber)?.phase;
      return phase ? INTERVAL_MS[phase] : INTERVAL_MS.LOBBY;
    },
    // Polling stops while the tab is hidden and resumes on focus — a spectator
    // who left the room open overnight costs nothing.
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 0,
  });

  const stamped = query.data as (DraftView & { receivedAt?: number }) | undefined;
  const skewMs =
    stamped?.serverTime && stamped.receivedAt
      ? Date.parse(stamped.serverTime) - stamped.receivedAt
      : 0;

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    skewMs: Number.isFinite(skewMs) ? skewMs : 0,
  };
}
