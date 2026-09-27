import type { Metadata } from "next";
import { fromSegment } from "@/lib/routing/filterRewrite";
import ChampionCountersPage, { generateMetadata as countersMetadata } from "../../../page";

// A filtered counters page, reached only through the middleware rewrite of
// `/counters/[champion]?tier=…&role=…` (ADR-061). The page is the same one; only where its filters
// come from differs, and that is what lets this copy be cached.
export const revalidate = 43200;
export const dynamic = "force-static";
export const dynamicParams = true;

interface Props {
  params: { champion: string; tier: string; role: string };
}

function searchParams(params: Props["params"]): { tier?: string; role?: string } {
  return { tier: fromSegment(params.tier), role: fromSegment(params.role) };
}

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return countersMetadata({
    params: { champion: params.champion },
    searchParams: searchParams(params),
  });
}

export default function FilteredCountersPage({ params }: Props): Promise<React.ReactElement> {
  return ChampionCountersPage({
    params: { champion: params.champion },
    searchParams: searchParams(params),
  });
}
