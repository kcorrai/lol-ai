import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DraftSeriesState, ViewerRole } from "@/domains/draft";

export interface DraftView {
  state: DraftSeriesState;
  role: ViewerRole;
}

export function draftQueryKey(code: string, gameNumber: number, token: string | null): unknown[] {
  return ["draft", code, gameNumber, token ? "drafter" : "spectator"];
}

/**
 * The room's view of a series. Polling and optimistic mutations arrive in
 * TASK-303; this is the plain read the lobby needs.
 */
export function useDraftSync(code: string, gameNumber: number, token: string | null) {
  return useQuery<DraftView>({
    queryKey: draftQueryKey(code, gameNumber, token),
    queryFn: () => {
      const params = new URLSearchParams({ game: String(gameNumber) });
      if (token) params.set("token", token);
      return apiFetch<DraftView>(`/api/draft/${code}?${params.toString()}`);
    },
    // The whole point of this response is freshness (ADR-016).
    staleTime: 0,
    gcTime: 0,
  });
}
