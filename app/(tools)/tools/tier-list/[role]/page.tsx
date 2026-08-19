import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getTierList,
  parsePosition,
  parseTier,
  POSITION_LABELS,
  POSITION_SLUG,
  ALL_POSITIONS,
  formatGamePatch,
} from "@/domains/meta";
import { getProPresence } from "@/domains/esports";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { TierListView } from "../TierListView";
import { tierBlurb } from "../tierBlurb";
import { PublicOnly } from "@/components/tools/PublicOnly";
import { jsonLdProps } from "@/lib/security/jsonLd";

export const revalidate = 43200; // 12h ISR
export const dynamicParams = false;

export function generateStaticParams(): { role: string }[] {
  return ALL_POSITIONS.map((pos) => ({ role: POSITION_SLUG[pos] }));
}

interface PageProps {
  params: { role: string };
  searchParams: { tier?: string };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const position = parsePosition(params.role);
  if (!position) return { title: "Tier list not found" };

  const lane = POSITION_LABELS[position];
  const rolePath = `/tools/tier-list/${POSITION_SLUG[position]}`;
  const list = await getTierList(position);
  const patch = list ? formatGamePatch(list.patch) : "";
  // Rank-filtered views are near-duplicates — keep them out of the index and
  // point canonical at the clean role page.
  const filtered = Boolean(parseTier(searchParams.tier));

  return {
    title: `LoL ${lane} Tier List${patch ? ` — Patch ${patch}` : ""}`,
    description: `The best ${lane} champions in League of Legends${patch ? ` on patch ${patch}` : ""}, ranked by real win rate, pick rate and ban rate with patch-over-patch movement. Free, updated every patch.`,
    alternates: { canonical: rolePath },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function RoleTierListPage({ params, searchParams }: PageProps) {
  const position = parsePosition(params.role);
  if (!position) notFound();

  const lane = POSITION_LABELS[position];
  const tier = parseTier(searchParams.tier);
  // Cache-only, so it costs nothing on a cold sample and hides its own column.
  const [list, proPresence] = await Promise.all([
    getTierList(position, tier ?? undefined),
    getProPresence(),
  ]);
  const patch = list ? formatGamePatch(list.patch) : "";

  const itemListJsonLd = list && {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `LoL ${lane} Tier List — Patch ${patch}`,
    itemListElement: list.entries.slice(0, 20).map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.name,
    })),
  };

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-8">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdProps(itemListJsonLd)}
        />
      )}

      <Breadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Tier List", href: "/tools/tier-list" },
          { name: lane, href: `/tools/tier-list/${POSITION_SLUG[position]}` },
        ]}
      />

      <PublicOnly>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">
          Free Tool · No login required
        </p>
      </PublicOnly>

      <TierListView
        mode="ranked"
        position={position}
        list={list}
        activeTier={tier}
        title={`LoL ${lane} tier list${patch ? ` — patch ${patch}` : ""}`}
        proPresence={proPresence}
        subtitle={`The strongest ${lane} champions this patch, ranked by real win rate with patch movement.`}
      />

      {list && list.entries.length > 0 && (
        <p className="mt-8 leading-relaxed text-text-muted">{tierBlurb(lane, list, patch)}</p>
      )}
    </div>
  );
}
