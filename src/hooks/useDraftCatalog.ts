import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DraftCatalog } from "@/domains/draft";

/**
 * The champion catalogue for a draft room — names, lanes and this patch's rates.
 * Fetched once and held for the whole series; it only changes on a patch, and a
 * live draft must never wait on a network round trip to render its grid.
 */
export function useDraftCatalog() {
  return useQuery<DraftCatalog>({
    queryKey: ["draft", "catalog"],
    queryFn: () => apiFetch<DraftCatalog>("/api/draft/champions"),
    staleTime: Infinity,
  });
}
