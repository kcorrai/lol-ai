"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { ArchiveFilters } from "@/domains/match/services/matchArchiveFilters";
import type { SavedSearchSummary } from "@/domains/match/services/savedSearchService";

const KEY = ["saved-searches"];

/**
 * Saved searches belong to the user, not to a Riot account — the filters describe a question
 * ("Ahri losses under 25 minutes"), and the same question is worth asking of either account.
 */
export function useSavedSearches() {
  return useQuery<SavedSearchSummary[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { searches } = await apiFetch<{ searches: SavedSearchSummary[] }>(
        "/api/match/archive/saved"
      );
      return searches;
    },
    staleTime: 5 * 60_000,
  });
}

export function useSaveSearch() {
  const queryClient = useQueryClient();

  return useMutation<SavedSearchSummary, Error, { name: string; filters: ArchiveFilters }>({
    mutationFn: async (input) => {
      const { search } = await apiFetch<{ search: SavedSearchSummary }>(
        "/api/match/archive/saved",
        { method: "POST", body: JSON.stringify(input) }
      );
      return search;
    },
    // Saving over an existing name replaces it rather than adding a row, so the list has to be
    // refetched rather than appended to — an append would show the same name twice.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation<{ deleted: boolean }, Error, string>({
    mutationFn: (searchId) =>
      apiFetch(`/api/match/archive/saved/${searchId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
