"use client";

import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { filtersToSearchParams } from "@/domains/match/archive/archiveQuery";
import type { ArchiveFilters } from "@/domains/match/services/matchArchiveFilters";
import type { ArchivePage, ArchiveTotals } from "@/domains/match/services/matchArchiveService";

export function useMatchArchive(riotAccountId: string | null | undefined, filters: ArchiveFilters) {
  const facets = filtersToSearchParams(filters);
  // The serialised facets *are* the cache key. Keying on the filter object would miss the cache on
  // every render, and keying on the fields by hand would need editing every time a facet is added.
  const facetKey = facets.toString();

  return useInfiniteQuery<ArchivePage>({
    queryKey: ["match-archive", riotAccountId, facetKey],
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams(facetKey);
      query.set("riotAccountId", riotAccountId as string);
      if (pageParam) query.set("cursor", pageParam as string);
      return apiFetch(`/api/match/archive?${query}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!riotAccountId,
    // An archive only grows at the back, and the rows already fetched do not change. Refetching a
    // long scroll on every window focus would throw away the pages the player walked down to.
    staleTime: 5 * 60_000,
  });
}

/**
 * The totals for the whole filtered set.
 *
 * The API sends them once, with the first page, and leaves them `null` on every continuation —
 * they describe the search, not the page, so recomputing them per page bought nothing. Reading page
 * zero rather than the newest page is what keeps the strip on screen: taking the last page's value
 * would paint a `null` over a number the player already had as soon as they asked for more.
 */
export function archiveTotals(data: InfiniteData<ArchivePage> | undefined): ArchiveTotals | null {
  return data?.pages[0]?.totals ?? null;
}

/** Every row fetched so far, flattened in the order the API returned them. */
export function archiveRows(data: InfiniteData<ArchivePage> | undefined) {
  return data?.pages.flatMap((page) => page.rows) ?? [];
}
