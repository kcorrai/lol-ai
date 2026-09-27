import type { Metadata } from "next";
import MatchPage, { generateMetadata as matchMetadata } from "../../page";

// One game of a series, reached only through the middleware rewrite of
// `/esports/matches/[matchId]?g=…` (ADR-061). The page is the same one; only where the game number
// comes from differs, and that is what lets this copy be cached. Middleware only rewrites 1–5.
export const revalidate = 300; // Same as the page it copies; see there.
export const dynamic = "force-static";
export const dynamicParams = true;

interface Props {
  params: { matchId: string; g: string };
}

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return matchMetadata({ params: { matchId: params.matchId }, searchParams: { g: params.g } });
}

export default function MatchGamePage({ params }: Props): Promise<React.ReactElement> {
  return MatchPage({ params: { matchId: params.matchId }, searchParams: { g: params.g } });
}
