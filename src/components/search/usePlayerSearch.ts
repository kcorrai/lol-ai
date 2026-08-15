"use client";

import { useEffect, useState } from "react";
import { MIN_QUERY_LENGTH } from "@/lib/riot/riotId";
import type { SearchHit } from "@/components/search/searchTypes";

/** Long enough that a fast typist makes one request per word, short enough to feel live. */
const DEBOUNCE_MS = 150;

interface Result {
  hits: readonly SearchHit[];
  isLoading: boolean;
}

/**
 * Debounced autocomplete against the player index.
 *
 * Deliberately not a TanStack Query hook: this is one throwaway request per pause in typing, with
 * every earlier one aborted, so there is nothing worth caching or sharing between components.
 */
export function usePlayerSearch(query: string, region: string): Result {
  const [hits, setHits] = useState<readonly SearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setHits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed, region });
        const res = await fetch(`/api/public/search?${params}`, { signal: controller.signal });
        const json = (await res.json()) as { data?: { players?: SearchHit[] } };
        setHits(json.data?.players ?? []);
      } catch {
        // Aborted by the next keystroke, or the network is down. Either way the index has nothing
        // to offer, and the direct Riot ID row still gets the player somewhere.
        setHits([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, region]);

  return { hits, isLoading };
}
