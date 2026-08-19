import type { Metadata } from "next";
import { getAramTierList, formatGamePatch } from "@/domains/meta";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { TierListView } from "../../tools/tier-list/TierListView";
import { jsonLdProps } from "@/lib/security/jsonLd";

export const revalidate = 43200; // 12h ISR

export async function generateMetadata(): Promise<Metadata> {
  const list = await getAramTierList();
  const patch = list ? formatGamePatch(list.patch) : "";
  return {
    title: `ARAM Tier List${patch ? ` — Patch ${patch}` : ""}`,
    description: `The best ARAM champions in League of Legends${patch ? ` on patch ${patch}` : ""}, ranked by real ARAM win rate and pick rate. Free, updated every patch.`,
    alternates: { canonical: "/aram/tier-list" },
  };
}

export default async function AramTierListPage() {
  const list = await getAramTierList();
  const patch = list ? formatGamePatch(list.patch) : "";

  const itemListJsonLd = list && {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `ARAM Tier List — Patch ${patch}`,
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
          { name: "ARAM Tier List", href: "/aram/tier-list" },
        ]}
      />

      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">
        Free Tool · No login required
      </p>

      <TierListView
        mode="aram"
        position={null}
        list={list}
        activeTier={null}
        title={`ARAM tier list${patch ? ` — patch ${patch}` : ""}`}
        proPresence={null}
        subtitle="Strongest champions in ARAM by real win rate. Separate dataset, ARAM balance applied."
      />
    </div>
  );
}
