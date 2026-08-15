import Image from "next/image";
import Link from "next/link";
import type { EsportsLeague } from "@/domains/esports/types";

/**
 * League tiles. Each links to its own hub, which is where standings and a league
 * schedule live (TASK-300) — the grid itself is navigation, not content.
 */
export function LeagueGrid({ leagues }: { leagues: EsportsLeague[] }): React.ReactElement | null {
  if (leagues.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {leagues.map((league) => (
        <Link
          key={league.id}
          href={`/esports/leagues/${league.slug}`}
          className="gaming-card notch-sm flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:border-line-2"
        >
          {league.image ? (
            <Image
              src={league.image}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 object-contain"
              aria-hidden
              unoptimized
            />
          ) : (
            <span className="h-6 w-6 shrink-0" aria-hidden />
          )}
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-bold uppercase text-text">
              {league.name}
            </span>
            <span className="block truncate text-[11px] capitalize text-text-faint">
              {league.region.toLowerCase()}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
