import type { Metadata } from "next";
import Link from "next/link";
import { getTierList, parsePosition, ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta";
import type { CanonicalPosition } from "@/domains/meta";
import { ToolBreadcrumb } from "@/domains/meta/components/ToolBreadcrumb";
import { TierRow } from "./TierRow";

export const revalidate = 43200; // 12h ISR

interface PageProps {
  searchParams: { role?: string };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const position = parsePosition(searchParams.role) ?? "MIDDLE";
  const list = await getTierList(position);
  const patch = list?.patch ?? "";
  const lane = POSITION_LABELS[position];
  return {
    title: `LoL Tier List ${patch ? `Patch ${patch}` : ""} — ${lane} Rankings | LoL AI Coach`,
    description: `The best ${lane} champions in League of Legends${patch ? ` on patch ${patch}` : ""}, ranked by real ranked win rate, pick rate and ban rate. Free, updated every patch.`,
    alternates: { canonical: "/tools/tier-list" },
  };
}

export default async function TierListPage({ searchParams }: PageProps) {
  const position: CanonicalPosition = parsePosition(searchParams.role) ?? "MIDDLE";
  const list = await getTierList(position);

  const itemListJsonLd = list && {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `LoL ${POSITION_LABELS[position]} Tier List — Patch ${list.patch}`,
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
          LoL Tier List{list ? ` — Patch ${list.patch}` : ""}
        </h1>
        <p className="mt-2 text-text-muted">
          The strongest champions per lane, ranked by real ranked win rate. Updated every patch.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {ALL_POSITIONS.map((pos) => (
          <Link
            key={pos}
            href={`/tools/tier-list?role=${pos}`}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              pos === position
                ? "bg-accent text-background"
                : "border border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text"
            }`}
          >
            {POSITION_LABELS[pos]}
          </Link>
        ))}
      </div>

      {!list || list.entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-text-muted">
          Tier data is unavailable right now. Please try again shortly.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface/60">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-text-muted">
                <th className="py-2 pl-3 pr-2 font-semibold">#</th>
                <th className="px-2 font-semibold">Tier</th>
                <th className="px-2 font-semibold">Champion</th>
                <th className="px-2 text-right font-semibold">Win</th>
                <th className="px-2 text-right font-semibold">Pick</th>
                <th className="py-2 pl-2 pr-3 text-right font-semibold">Ban</th>
              </tr>
            </thead>
            <tbody>
              {list.entries.map((entry, i) => (
                <TierRow key={entry.championKey} entry={entry} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
