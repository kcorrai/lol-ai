import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DraftSummary } from "@/domains/draft/services/draftSummaryService";

/** The verdict for a finished game. Only requested once the draft is over, so
 *  it never fires during a live turn. */
export function useDraftSummary(code: string, gameNumber: number, enabled: boolean) {
  return useQuery<DraftSummary>({
    queryKey: ["draft", "summary", code, gameNumber],
    queryFn: () => apiFetch<DraftSummary>(`/api/draft/${code}/summary?game=${gameNumber}`),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
