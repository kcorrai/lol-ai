"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { archiveFacetOptions } from "@/domains/match/services/matchArchiveService";

/** Tied to the service's own return type, so a facet added there shows up here as a type error. */
export type ArchiveOptions = Awaited<ReturnType<typeof archiveFacetOptions>>;

/**
 * The champions, patches and queues actually present in this player's archive.
 *
 * The console offers only these, which is what stops a search being buildable that is guaranteed to
 * return nothing — picking a champion you have never played is not a filter, it is a dead end.
 */
export function useArchiveOptions(riotAccountId: string | null | undefined) {
  return useQuery<ArchiveOptions>({
    queryKey: ["archive-options", riotAccountId],
    queryFn: () => apiFetch(`/api/match/archive/options?riotAccountId=${riotAccountId}`),
    enabled: !!riotAccountId,
    // The set only changes when a sync brings in a champion or patch the player had never touched.
    staleTime: 10 * 60_000,
  });
}
