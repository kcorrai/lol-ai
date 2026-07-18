import { useQuery } from "@tanstack/react-query";

export interface Champion {
  id: number;
  key: string;
  name: string;
  imageUrl: string;
  roles: string[];
}

// Full champion list for selectors/filters. Cached indefinitely — the catalog
// only changes on a patch, and a page reload picks that up.
export function useAllChampions() {
  return useQuery<Champion[]>({
    queryKey: ["champions", "all"],
    queryFn: () =>
      fetch("/api/champions/all")
        .then((r) => r.json())
        .then((d) => d.data),
    staleTime: Infinity,
  });
}
