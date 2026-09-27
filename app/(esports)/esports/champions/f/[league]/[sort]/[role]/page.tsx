import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeagues } from "@/domains/esports";
import { fromSegment } from "@/lib/routing/filterRewrite";
import ProChampionsPage, { generateMetadata as championsMetadata } from "../../../../page";

// A filtered pro champions page, reached only through the middleware rewrite of
// `/esports/champions?league=…&sort=…&role=…` (ADR-061). The page is the same one; only where its
// filters come from differs, and that is what lets this copy be cached.
export const revalidate = 3600;
export const dynamic = "force-static";
export const dynamicParams = true;

interface Props {
  params: { league: string; sort: string; role: string };
}

function searchParams(params: Props["params"]): { league?: string; sort?: string; role?: string } {
  return {
    league: fromSegment(params.league),
    sort: fromSegment(params.sort),
    role: fromSegment(params.role),
  };
}

/**
 * Middleware can only check a league's shape. A slug no league has is refused here, so a made-up
 * one cannot mint a cached copy of the unfiltered page.
 */
async function assertLeague(slug: string | undefined): Promise<void> {
  if (slug === undefined) return;
  const leagues = await getLeagues();
  if (!leagues.some((league) => league.slug === slug)) notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return championsMetadata({ searchParams: searchParams(params) });
}

export default async function FilteredProChampionsPage({
  params,
}: Props): Promise<React.ReactElement> {
  const filters = searchParams(params);
  await assertLeague(filters.league);
  return ProChampionsPage({ searchParams: filters });
}
