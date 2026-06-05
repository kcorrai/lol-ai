import { useQuery } from "@tanstack/react-query";
import { DDRAGON_VERSION } from "@/lib/ddragon";

type DDragonRune = { name: string; icon: string };
type DDragonRuneSlot = { runes: DDragonRune[] };
type DDragonRuneTree = { name: string; icon: string; slots: DDragonRuneSlot[] };

const DDRAGON_IMG = "https://ddragon.leagueoflegends.com/cdn/img";

export function useDDragonRunes(): { getRuneIconUrl: (name: string) => string | null } {
  const { data: nameToUrl } = useQuery<Map<string, string>>({
    queryKey: ["ddragon-runes"],
    queryFn: async () => {
      const res = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/en_US/runesReforged.json`
      );
      const trees: DDragonRuneTree[] = await res.json();
      const map = new Map<string, string>();
      for (const tree of trees) {
        map.set(tree.name.toLowerCase(), `${DDRAGON_IMG}/${tree.icon}`);
        for (const slot of tree.slots) {
          for (const rune of slot.runes) {
            map.set(rune.name.toLowerCase(), `${DDRAGON_IMG}/${rune.icon}`);
          }
        }
      }
      return map;
    },
    staleTime: Infinity,
  });

  function getRuneIconUrl(name: string): string | null {
    if (!nameToUrl) return null;
    return nameToUrl.get(name.toLowerCase()) ?? null;
  }

  return { getRuneIconUrl };
}
