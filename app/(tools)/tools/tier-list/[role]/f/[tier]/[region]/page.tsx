import type { Metadata } from "next";
import { fromSegment } from "@/domains/meta/toolFilterRoutes";
import RoleTierListPage, { generateMetadata as roleMetadata } from "../../../page";

// A filtered role tier list, reached only through the middleware rewrite of
// `/tools/tier-list/[role]?tier=…&region=…` (ADR-061). The page is the same one; only where its
// filters come from differs, and that is what lets this copy be cached.
export const revalidate = 43200;
export const dynamic = "force-static";
export const dynamicParams = true;

interface Props {
  params: { role: string; tier: string; region: string };
}

function searchParams(params: Props["params"]): { tier?: string; region?: string } {
  return { tier: fromSegment(params.tier), region: fromSegment(params.region) };
}

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return roleMetadata({ params: { role: params.role }, searchParams: searchParams(params) });
}

export default function FilteredRoleTierListPage({ params }: Props): Promise<React.ReactElement> {
  return RoleTierListPage({ params: { role: params.role }, searchParams: searchParams(params) });
}
