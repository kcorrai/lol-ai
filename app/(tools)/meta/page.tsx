import type { Metadata } from "next";
import Link from "next/link";
import { getMetaReport, formatGamePatch } from "@/domains/meta";
import { patchNotesUrl } from "@/lib/lolPatch";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { DataFreshness } from "@/domains/meta/components/DataFreshness";
import { MoverList } from "./MoverList";
import { MetaHero } from "./MetaHero";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { metaSummary, metaFaq } from "./metaReportText";
import { jsonLdProps } from "@/lib/security/jsonLd";

export const revalidate = 43200; // 12h ISR

export async function generateMetadata(): Promise<Metadata> {
  const report = await getMetaReport();
  const patch = report ? formatGamePatch(report.patch) : "";
  return {
    title: `LoL Patch ${patch} Meta Report — Winners & Losers`,
    description: `The biggest winners and losers of League of Legends patch ${patch}: which champions climbed the rankings, which fell off, and what it means for your climb. Free, updated every patch.`,
    alternates: { canonical: "/meta" },
  };
}

export default async function MetaReportPage() {
  const report = await getMetaReport();

  if (!report || (report.climbers.length === 0 && report.fallers.length === 0)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-black text-text">Meta report</h1>
        <p className="mt-3 text-text-muted">
          The patch meta report is unavailable right now. Please try again shortly.
        </p>
      </div>
    );
  }

  // Ability clips are keyed by Riot's numeric champion id, which MetaMover doesn't carry.
  const champions = await fetchAllChampions();
  const numericKeys = new Map(champions.map((c) => [c.id, c.key]));

  const patch = formatGamePatch(report.patch);
  const summary = metaSummary(report, patch);
  const faq = metaFaq(report, patch);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `LoL Patch ${patch} biggest winners`,
      itemListElement: report.climbers.map((m, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: m.name,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `LoL Patch ${patch} biggest losers`,
      itemListElement: report.fallers.map((m, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: m.name,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      {jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps(ld)} />
      ))}

      <Breadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Meta Report", href: "/meta" },
        ]}
      />

      <header className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          Free · No login required
        </p>
        <h1 className="font-display text-3xl font-black text-text md:text-4xl">
          LoL Patch {patch} Meta Report — Winners &amp; Losers
        </h1>
      </header>

      {/* Freshness strip */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
        <DataFreshness
          fetchedAt={report.fetchedAt}
          patch={report.patch}
          matchCount={report.matchCount}
        />
        <span aria-hidden>·</span>
        <a
          href={patchNotesUrl(report.patch)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Official patch notes ↗
        </a>
      </div>

      <div className="mb-8" />

      <MetaHero climber={report.climbers[0]} faller={report.fallers[0]} numericKeys={numericKeys} />

      <div className="grid gap-4 md:grid-cols-2">
        <MoverList title="Biggest Winners" movers={report.climbers} direction="up" />
        <MoverList title="Biggest Losers" movers={report.fallers} direction="down" />
      </div>

      {/* Kept in the HTML for search (TASK-186 added it for Google's scaled-content rules), but
          folded away — it was the first thing on the page and nobody read it. */}
      <details className="group mt-6 rounded-2xl border border-border bg-surface/60 p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-text marker:hidden">
          <span className="text-accent group-open:hidden">Read the full patch breakdown →</span>
          <span className="hidden text-accent group-open:inline">Hide the full breakdown ↑</span>
        </summary>
        <p className="mt-3 leading-relaxed text-text-muted">{summary}</p>
      </details>

      <p className="mt-4 text-xs leading-relaxed text-text-muted/70">
        How this is calculated: movement is the change in a champion&apos;s overall op.gg rank
        versus the previous patch. We only include champions picked in at least 0.5% of games that
        moved 3+ ranks, weighted by pick rate so popular shifts rank above fringe ones. Figures
        reflect rank movement, not win-rate change. WR = win rate, PR = pick rate, BR = ban rate.
      </p>

      {/* FAQ */}
      <div className="mt-10">
        <h2 className="mb-3 font-display text-lg font-bold text-text">Patch {patch} FAQ</h2>
        <div className="space-y-3">
          {faq.map((f) => (
            <div key={f.question} className="rounded-xl border border-border bg-surface p-4">
              <p className="font-semibold text-text">{f.question}</p>
              <p className="mt-1 text-sm text-text-muted">{f.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-links */}
      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link
          href="/tools/tier-list"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text"
        >
          Full tier list →
        </Link>
        <Link
          href="/builds"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text"
        >
          Champion builds →
        </Link>
        <Link
          href="/esports/champions"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text"
        >
          What the pros are picking →
        </Link>
        <Link
          href="/aram/tier-list"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text"
        >
          ARAM tier list →
        </Link>
      </div>
    </div>
  );
}
