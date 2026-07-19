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
import { ToolBreadcrumb } from "@/domains/meta/components/ToolBreadcrumb";
import { TierListView } from "../TierListView";
import { tierBlurb } from "../tierBlurb";
import { PublicOnly } from "@/components/tools/PublicOnly";

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
  const list = await getTierList(position, tier ?? undefined);
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
    <div className="mx-auto max-w-4xl px-4 py-14">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <ToolBreadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Tier List", href: "/tools/tier-list" },
          { name: lane, href: `/tools/tier-list/${POSITION_SLUG[position]}` },
        ]}
      />

      <header className="mb-6">
        <PublicOnly>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            Free Tool · No login required
          </p>
        </PublicOnly>
        <h1 className="font-display text-3xl font-black text-text md:text-4xl">
          LoL {lane} Tier List{patch ? ` — Patch ${patch}` : ""}
        </h1>
        <p className="mt-2 text-text-muted">
          The strongest {lane} champions this patch, ranked by real win rate with patch movement.
        </p>
      </header>

      <TierListView position={position} list={list} activeTier={tier} />

      {list && list.entries.length > 0 && (
        <p className="mt-8 leading-relaxed text-text-muted">{tierBlurb(lane, list, patch)}</p>
      )}
    </div>
  );
}
