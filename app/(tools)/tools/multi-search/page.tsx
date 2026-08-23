import type { Metadata } from "next";
import { headers } from "next/headers";
import { buildLobbyScout, parseIdsParam, toIdsParam } from "@/domains/riot";
import { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
import { checkRateLimit, ipFromHeaders } from "@/lib/api/rateLimit";
import { LobbyResults } from "./LobbyResults";
import { MultiSearchForm } from "./MultiSearchForm";

export const dynamic = "force-dynamic";

/**
 * Ten players at four Riot calls each, so this throttles like the live scout and unlike the rest
 * of the free tools. Both are pages whose cost is on the page rather than behind a route.
 */
const RATE_LIMIT = { limit: 20, windowMs: 60_000 };

const DEFAULT_REGION = "euw1";

interface PageProps {
  searchParams: { region?: string; ids?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const hasLobby = Boolean(searchParams.ids);
  return {
    title: "LoL Multi-Search — Scout a Whole Lobby | LoL AI Coach",
    description:
      "Paste the champion select chat and see every player's rank and most-played champions at once. Free, no login, no app to install.",
    alternates: { canonical: "/tools/multi-search" },
    // A scouted lobby is one person's throwaway link — the empty tool is the page worth indexing.
    ...(hasLobby ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function MultiSearchPage({ searchParams }: PageProps) {
  const requested = searchParams.region?.trim().toLowerCase();
  const region = requested && VALID_REGIONS.includes(requested) ? requested : DEFAULT_REGION;
  const ids = parseIdsParam(searchParams.ids);

  let scout = null;
  let throttled = false;

  if (ids.length > 0) {
    const limit = await checkRateLimit(`multi-search:${ipFromHeaders(headers())}`, RATE_LIMIT);
    if (limit.allowed) {
      scout = await buildLobbyScout(ids, region);
    } else {
      throttled = true;
    }
  }

  return (
    <div className="mx-auto max-w-[1240px] space-y-5 px-4 py-8 md:px-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold uppercase text-text md:text-[28px]">
          Multi-search
        </h1>
        <p className="mt-2 max-w-[620px] text-sm text-text-muted">
          Paste the champion select chat — or just a list of Riot IDs — and see everyone&apos;s rank
          and champion pool before you lock in. Champion select is invisible to Riot&apos;s
          spectator API, so a paste is the only way to read a lobby before the game starts.
        </p>
      </header>

      <MultiSearchForm region={region} initialText={toIdsParam(ids)} />

      {throttled && (
        <p className="notch border border-border bg-surface p-4 text-sm text-text-muted">
          That is a lot of scouting in one minute. Each lobby reads ten players from Riot, so this
          page is capped harder than the rest of the tools — try again shortly.
        </p>
      )}

      {scout && <LobbyResults scout={scout} />}
    </div>
  );
}
