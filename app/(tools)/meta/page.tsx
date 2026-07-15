import type { Metadata } from "next";
import Link from "next/link";
import { getMetaReport, formatGamePatch } from "@/domains/meta";
import { patchNotesUrl } from "@/lib/lolPatch";
import { ToolBreadcrumb } from "@/domains/meta/components/ToolBreadcrumb";
import { MoverList } from "./MoverList";
import { metaSummary, metaFaq } from "./metaReportText";

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

function hoursAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000));
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
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}

      <ToolBreadcrumb
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
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
        <span>Data updated {hoursAgo(report.fetchedAt)}h ago</span>
        <span aria-hidden>·</span>
        <span>Patch {patch}</span>
        {report.matchCount && (
          <>
            <span aria-hidden>·</span>
            <span>{report.matchCount.toLocaleString()} ranked games analyzed</span>
          </>
        )}
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

      <p className="mb-8 leading-relaxed text-text-muted">{summary}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <MoverList title="Biggest Winners" movers={report.climbers} direction="up" />
        <MoverList title="Biggest Losers" movers={report.fallers} direction="down" />
      </div>

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
        <Link href="/tools/tier-list" className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text">
          Full tier list →
        </Link>
        <Link href="/builds" className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text">
          Champion builds →
        </Link>
        <Link href="/aram/tier-list" className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text">
          ARAM tier list →
        </Link>
      </div>
    </div>
  );
}
