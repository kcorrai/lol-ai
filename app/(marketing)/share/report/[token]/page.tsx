import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicReport } from "@/domains/coaching/services/reportService";

export const dynamic = "force-dynamic";

interface Props {
  params: { token: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const report = await getPublicReport(params.token);
    return {
      title: `${report.gameName}#${report.tagLine} — AI Koç Raporu`,
      description: report.summary?.slice(0, 155) ?? "League of Legends AI koç analizi.",
    };
  } catch {
    return { title: "Paylaşılan Rapor" };
  }
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  session_review: "Seans Değerlendirmesi",
  climb_roadmap: "Rank Atlama Yol Haritası",
  champion_deep_dive: "Şampiyon Analizi",
  mental_coaching: "Mental Koçluk",
};

export default async function SharedReportPage({ params }: Props) {
  let report;
  try {
    report = await getPublicReport(params.token);
  } catch {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
  const typeLabel = REPORT_TYPE_LABELS[report.reportType] ?? report.reportType;
  const date = report.completedAt
    ? new Date(report.completedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Brand bar */}
      <div className="border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-display text-base font-bold text-accent hover:opacity-80">
          ⚡ LoL AI Coach
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-accent px-4 py-1.5 text-xs font-bold text-background hover:opacity-90 transition-opacity"
        >
          Ücretsiz Dene →
        </Link>
      </div>

      <div className="mx-auto max-w-xl px-4 py-10 space-y-4">
        {/* Header card */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60 mb-1">
                {typeLabel}
              </p>
              <h1 className="font-display text-xl font-bold text-text">
                {report.gameName}
                <span className="text-text-muted/60">#{report.tagLine}</span>
              </h1>
              {report.rankDisplay && (
                <p className="mt-1 text-sm text-accent font-medium">{report.rankDisplay}</p>
              )}
              {date && <p className="mt-1 text-xs text-text-muted">{date}</p>}
            </div>
            <div className="shrink-0 rounded-xl bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent border border-accent/20">
              AI Raporu
            </div>
          </div>
        </div>

        {/* Summary */}
        {report.summary && (
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
              Genel Değerlendirme
            </h2>
            <p className="text-sm leading-relaxed text-text">{report.summary}</p>
          </div>
        )}

        {/* Coach persona response */}
        {report.coachPersonaResponse && (
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-accent/70">
              Koç Yorumu
            </h2>
            <p className="text-sm leading-relaxed text-text italic">
              &ldquo;{report.coachPersonaResponse}&rdquo;
            </p>
          </div>
        )}

        {/* First action item */}
        {report.firstActionItem && (
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
              Öncelikli Görev
            </h2>
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-text">{report.firstActionItem.action}</p>
                <p className="mt-1 text-xs text-text-muted">{report.firstActionItem.expectedImpact}</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          className="rounded-2xl border border-accent/30 p-6 text-center"
          style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.08) 0%, rgba(88,70,180,0.06) 100%)" }}
        >
          <p className="mb-1 text-sm font-semibold text-text">
            Kendi AI koç raporunu al
          </p>
          <p className="mb-4 text-xs text-text-muted">
            Ücretsiz başla — 3 rapor/ay, kredi kartı gerekmez.
          </p>
          <Link
            href={`${appUrl}/register`}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90"
          >
            Ücretsiz AI Analiz Al →
          </Link>
        </div>
      </div>
    </div>
  );
}
