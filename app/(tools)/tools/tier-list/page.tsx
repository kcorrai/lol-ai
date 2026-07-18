import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getTierList, parsePosition, POSITION_SLUG, formatGamePatch } from "@/domains/meta";
import type { CanonicalPosition } from "@/domains/meta";
import { ToolBreadcrumb } from "@/domains/meta/components/ToolBreadcrumb";
import { TierListView } from "./TierListView";
import { tierBlurb } from "./tierBlurb";
import { RelatedTools } from "../../RelatedTools";

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

  const list = await getTierList(DEFAULT_POSITION);
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
        ]}
      />

      <header className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          Free Tool · No login required
        </p>
        <h1 className="font-display text-3xl font-black text-text md:text-4xl">
          LoL Tier List{patch ? ` — Patch ${patch}` : ""}
        </h1>
        <p className="mt-2 text-text-muted">
          The strongest champions per lane, ranked by real ranked win rate. Pick a lane below.
        </p>
      </header>

      <TierListView position={DEFAULT_POSITION} list={list} activeTier={null} />

      {list && list.entries.length > 0 && (
        <p className="mt-8 leading-relaxed text-text-muted">{tierBlurb(lane, list, patch)}</p>
      )}

      <RelatedTools exclude="/tools/tier-list" />
    </div>
  );
}
