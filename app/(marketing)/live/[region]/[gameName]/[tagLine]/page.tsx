import type { Metadata } from "next";
import { headers } from "next/headers";
import { buildLiveScout, VALID_REGIONS } from "@/domains/riot";
import { ApiError } from "@/lib/api/errors";
import { checkRateLimit, ipFromHeaders } from "@/lib/api/rateLimit";
import { regionLabel } from "@/lib/riot/regions";
import { LiveScoutEmpty } from "../../../components/LiveScoutEmpty";
import { LiveScoutView } from "../../../components/LiveScoutView";

export const dynamic = "force-dynamic";

/**
 * Scouting reads ten players from Riot at once — an order of magnitude more budget than any other
 * public page — so unlike them this one throttles at the page itself rather than behind a route.
 */
const RATE_LIMIT = { limit: 20, windowMs: 60_000 };

interface Props {
  params: { region: string; gameName: string; tagLine: string };
}

function decode(params: Props["params"]) {
  return {
    gameName: decodeURIComponent(params.gameName),
    tagLine: decodeURIComponent(params.tagLine),
    region: params.region.toLowerCase(),
  };
}

export function generateMetadata({ params }: Props): Metadata {
  const { gameName, tagLine, region } = decode(params);
  const riotId = `${gameName}#${tagLine}`;
  return {
    title: `${riotId} — Live Game | LaneIQ`,
    description: `Who ${riotId} is in a game with on ${regionLabel(region)}: every player's rank, the inferred lanes and what the draft says. Free, no login.`,
    // A game lasts half an hour and the URL then means something else entirely. There is nothing
    // here worth indexing, and letting a crawler walk it would open an unbounded surface.
    robots: { index: false, follow: false },
  };
}

export default async function LiveGamePage({ params }: Props): Promise<React.ReactElement> {
  const { gameName, tagLine, region } = decode(params);
  const riotId = `${gameName}#${tagLine}`;

  if (!VALID_REGIONS.includes(region)) {
    return <LiveScoutEmpty riotId={riotId} region={region} reason="not-found" />;
  }

  const limit = await checkRateLimit(`live-scout:${ipFromHeaders(headers())}`, RATE_LIMIT);
  if (!limit.allowed) {
    return <LiveScoutEmpty riotId={riotId} region={region} reason="throttled" />;
  }

  try {
    const scout = await buildLiveScout(gameName, tagLine, region);
    if (!scout.inGame) {
      return <LiveScoutEmpty riotId={riotId} region={region} reason="not-in-game" />;
    }
    return <LiveScoutView scout={scout} riotId={riotId} region={region} />;
  } catch (err) {
    // Branch on the machine-readable code, never the message (TASK-285).
    const code = err instanceof ApiError ? err.code : null;
    return (
      <LiveScoutEmpty
        riotId={riotId}
        region={region}
        reason={code === "RIOT_RATE_LIMITED" ? "rate-limited" : "not-found"}
      />
    );
  }
}
