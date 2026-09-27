import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { archiveLeagues, getVodArchive } from "@/domains/esports";
import { fromSegment } from "@/lib/routing/filterRewrite";
import EsportsVodsPage, { generateMetadata as vodsMetadata } from "../../../page";

// A filtered or lengthened VOD archive, reached only through the middleware rewrite of
// `/esports/vods?league=…&show=…` (ADR-061). The page is the same one; only where its filters come
// from differs, and that is what lets this copy be cached.
export const revalidate = 900;
export const dynamic = "force-static";
export const dynamicParams = true;

interface Props {
  params: { league: string; show: string };
}

function searchParams(params: Props["params"]): { league?: string; show?: string } {
  return { league: fromSegment(params.league), show: fromSegment(params.show) };
}

/**
 * Middleware can only check a league name's shape. A name the archive does not carry is refused
 * here, so a made-up one cannot mint a cached empty archive.
 */
async function assertLeague(name: string | undefined): Promise<void> {
  if (name === undefined) return;
  const leagues = archiveLeagues(await getVodArchive());
  if (!leagues.some((league) => league.name === name)) notFound();
}

export function generateMetadata({ params }: Props): Metadata {
  return vodsMetadata({ searchParams: searchParams(params) });
}

export default async function FilteredVodsPage({ params }: Props): Promise<React.ReactElement> {
  const filters = searchParams(params);
  await assertLeague(filters.league);
  return EsportsVodsPage({ searchParams: filters });
}
