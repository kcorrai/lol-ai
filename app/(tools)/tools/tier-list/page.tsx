import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getTierList, parsePosition, POSITION_SLUG, formatGamePatch } from "@/domains/meta";
import type { CanonicalPosition } from "@/domains/meta";
import { getProPresence } from "@/domains/esports";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { TierListView } from "./TierListView";
import { tierBlurb } from "./tierBlurb";
import { RelatedTools } from "../../RelatedTools";
import { PublicOnly } from "@/components/tools/PublicOnly";
import { jsonLdProps } from "@/lib/security/jsonLd";

export const revalidate = 43200; // 12h ISR

// The default landing view; role-specific hubs live at /tools/tier-list/[role].
const DEFAULT_POSITION: CanonicalPosition = "MIDDLE";

interface PageProps {
  searchParams: { role?: string };
}

export async function generateMetadata(): Promise<Metadata> {
  const list = await getTierList(DEFAULT_POSITION);
  const patch = list ? formatGamePatch(list.patch) : "";
  return {
    title: `LoL Tier List${patch ? ` — Patch ${patch}` : ""} — Best Champions Every Lane`,
    description: `The best champions in League of Legends${patch ? ` on patch ${patch}` : ""}, ranked by real win rate, pick rate and ban rate per lane. Free, updated every patch.`,
    alternates: { canonical: "/tools/tier-list" },
  };
}

export default async function TierListPage({ searchParams }: PageProps) {
  // Legacy ?role= query params are consolidated onto the path-based role hubs.
  const requested = parsePosition(searchParams.role);
  if (requested) permanentRedirect(`/tools/tier-list/${POSITION_SLUG[requested]}`);

  // The pro read is cache-only and resolves to null on a cold sample, so it can
  // sit beside the tier list rather than behind it (TASK-310).
  const [list, proPresence] = await Promise.all([getTierList(DEFAULT_POSITION), getProPresence()]);
  const patch = list ? formatGamePatch(list.patch) : "";
  const lane = "Mid";

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
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps(itemListJsonLd)} />
      )}

      <Breadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Tier List", href: "/tools/tier-list" },
        ]}
      />

      <PublicOnly>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">
          Free Tool · No login required
        </p>
      </PublicOnly>

      <TierListView
        mode="ranked"
        position={DEFAULT_POSITION}
        list={list}
        activeTier={null}
        activeRegion={null}
        title={`LoL tier list${patch ? ` — patch ${patch}` : ""}`}
        proPresence={proPresence}
        subtitle="Strongest champions per lane by real ranked win rate. Pick a lane and a rank band."
      />

      {list && list.entries.length > 0 && (
        <p className="mt-8 leading-relaxed text-text-muted">{tierBlurb(lane, list, patch)}</p>
      )}

      <RelatedTools exclude="/tools/tier-list" />
    </div>
  );
}
