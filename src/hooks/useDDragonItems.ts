import { useQuery } from "@tanstack/react-query";
import { DDRAGON_VERSION, itemIconUrl } from "@/lib/ddragon";

type DDragonItemsResponse = {
  data: Record<string, { name: string }>;
};

// Normalize Unicode curly apostrophes (AI output) to ASCII straight apostrophe (DDragon names)
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[‘’‛ʼ]/g, "'");
}

export function useDDragonItems(): { getItemIconUrl: (name: string) => string | null } {
  const { data: nameToId } = useQuery<Map<string, number>>({
    queryKey: ["ddragon-items"],
    queryFn: async () => {
      const res = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/en_US/item.json`
      );
      const json: DDragonItemsResponse = await res.json();
      const map = new Map<string, number>();
      for (const [id, item] of Object.entries(json.data)) {
        map.set(normalizeName(item.name), Number(id));
      }
      return map;
    },
    staleTime: Infinity,
  });

  function getItemIconUrl(name: string): string | null {
    if (!nameToId) return null;
    const id = nameToId.get(normalizeName(name));
    return id ? itemIconUrl(id) : null;
  }

  return { getItemIconUrl };
}
