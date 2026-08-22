"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  EMPTY_FILTERS,
  filtersToSearchParams,
  searchParamsToFilters,
} from "@/domains/match/archive/archiveQuery";
import type { ArchiveFilters } from "@/domains/match/services/matchArchiveFilters";

/**
 * The archive's filter state, which lives in the URL rather than in React or in a store.
 *
 * That is the whole point of the screen: a search is a thing you send someone, and a thing the back
 * button can walk out of. Holding it in state would make both impossible, and holding it in Zustand
 * would put a server query's parameters in a client-UI store.
 */
export function useArchiveFilters(): {
  filters: ArchiveFilters;
  setFilters: (next: ArchiveFilters) => void;
  clearFilters: () => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => searchParamsToFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const setFilters = useCallback(
    (next: ArchiveFilters) => {
      const query = filtersToSearchParams(next).toString();
      // `push`, not `replace`: each applied search is somewhere the player has been, so back has to
      // return them to the previous one rather than out of the screen entirely. `scroll: false`
      // because they are usually looking at the console, not the top of the page.
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), [setFilters]);

  return { filters, setFilters, clearFilters };
}
