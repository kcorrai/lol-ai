import type { Metadata } from "next";
import Link from "next/link";
import { getAramTierList, formatGamePatch } from "@/domains/meta";
import { ToolBreadcrumb } from "@/domains/meta/components/ToolBreadcrumb";
import { DataFreshness } from "@/domains/meta/components/DataFreshness";
import { SortableTierTable } from "../../tools/tier-list/SortableTierTable";

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
          { name: "ARAM Tier List", href: "/aram/tier-list" },
        ]}
      />

      <header className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          Free Tool · No login required
        </p>
        <h1 className="font-display text-3xl font-black text-text md:text-4xl">
          ARAM Tier List{patch ? ` — Patch ${patch}` : ""}
        </h1>
        <p className="mt-2 text-text-muted">
          The strongest champions in ARAM, ranked by real win rate. Updated every patch.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-1.5">
        <Link
          href="/tools/tier-list"
          className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:border-accent/40 hover:text-text"
        >
          Ranked
        </Link>
        <span className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-background">
          ARAM
        </span>
      </div>

      {list && (
        <DataFreshness
          fetchedAt={list.fetchedAt}
          patch={list.patch}
          matchCount={list.matchCount}
          gamesLabel="ARAM games analyzed"
          className="mb-4"
        />
      )}

      {!list || list.entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-text-muted">
          ARAM tier data is unavailable right now. Please try again shortly.
        </p>
      ) : (
        <SortableTierTable
          entries={list.entries}
          hrefBase="/aram"
          showBan={false}
          minWidthClass="min-w-[440px]"
        />
      )}
    </div>
  );
}
