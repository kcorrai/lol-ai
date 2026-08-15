import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { CounterTables } from "@/domains/draft/advice/advice.types";

/**
 * Matchup tables for the champions currently on the board.
 *
 * Keyed by the sorted key list, so a lock adds one champion and fetches one new
 * table while the previous ten stay cached. Over a whole game that is at most
 * ten small requests — nothing per turn, and nothing at all once the board stops
 * changing.
 */
export function useDraftCounters(keys: readonly string[]) {
  const sorted = [...keys].map((k) => k.toLowerCase()).sort();

  return useQuery<CounterTables>({
    queryKey: ["draft", "counters", sorted.join(",")],
    queryFn: () =>
      sorted.length === 0
        ? Promise.resolve({})
        : apiFetch<CounterTables>(`/api/draft/counters?keys=${sorted.join(",")}`),
    staleTime: Infinity,
  });
}
