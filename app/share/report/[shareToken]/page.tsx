import Link from "next/link";
import type { Metadata } from "next";
import { getPublicReport } from "@/domains/coaching/services/reportService";

interface Props {
  params: { shareToken: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
  const canonicalUrl = `${appUrl}/share/report/${params.shareToken}`;

  try {
    const report = await getPublicReport(params.shareToken);
    const title = `${report.gameName}'s AI Coaching Report — LoL AI Coach`;
    const description = report.summary ?? "AI-powered League of Legends coaching report.";

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: `${report.gameName}'s AI Coaching Report`,
        description: report.summary ?? "AI-powered coaching insight.",
        images: [`${appUrl}/api/og/report/${params.shareToken}`],
        type: "website",
        url: canonicalUrl,
      },
      twitter: {
        card: "summary_large_image",
        title: `${report.gameName}'s AI Coaching Report`,
        description: report.summary ?? "AI-powered coaching insight.",
        images: [`${appUrl}/api/og/report/${params.shareToken}`],
      },
    };
  } catch {
    return {
      title: "Coaching Report — LoL AI Coach",
      alternates: { canonical: canonicalUrl },
    };
  }
}

const REPORT_TYPE_LABEL: Record<string, string> = {
  session_review: "Seans Değerlendirmesi",
  champion_focus: "Şampiyon Odağı",
  climb_roadmap: "Çıkış Planı",
};

export default async function ShareReportPage({ params }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

  let report: Awaited<ReturnType<typeof getPublicReport>>;
  try {
    report = await getPublicReport(params.shareToken);
  } catch {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <p className="font-display text-2xl font-bold text-text">Rapor bulunamadı</p>
        <p className="mt-2 text-sm text-text-muted">
          Bu bağlantının süresi dolmuş ya da iptal edilmiş olabilir.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background"
        >
          Kendi AI Raporunu Al
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Branding */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="font-display text-sm font-bold text-accent">
            LoL AI Coach
          </Link>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs text-text-muted">
            {REPORT_TYPE_LABEL[report.reportType] ?? report.reportType}
          </span>
        </div>

        {/* Player header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-text md:text-4xl">
            {report.gameName}
            <span className="ml-2 text-base font-normal text-text-muted">
              #{report.tagLine}
            </span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {report.rankDisplay && (
              <span className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                {report.rankDisplay}
              </span>
            )}
            {report.topChampionName && (
              <span className="rounded-md bg-surface-2 px-2.5 py-1 text-xs text-text-muted">
                {report.topChampionName}
              </span>
            )}
            {report.completedAt && (
              <span className="text-xs text-text-muted">
                {new Date(report.completedAt).toLocaleDateString("tr-TR")} tarihinde oluşturuldu
              </span>
            )}
          </div>
        </div>

        {/* Summary card */}
        {report.summary && (
          <div className="mb-4 rounded-xl border border-border bg-surface p-6">
            <p className="text-sm leading-relaxed text-text">{report.summary}</p>
          </div>
        )}

        {/* Coach persona */}
        {report.coachPersonaResponse && (
          <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
              Koç Diyor
            </p>
            <p className="text-sm italic leading-relaxed text-text">
              &ldquo;{report.coachPersonaResponse}&rdquo;
            </p>
          </div>
        )}

        {/* First action item teaser */}
        {report.firstActionItem && (
          <div className="mb-6 rounded-xl border border-border bg-surface p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">
              En Önemli Öneri
            </p>
            <p className="font-medium text-text">{report.firstActionItem.action}</p>
            <p className="mt-1 text-xs text-success">
              Beklenen etki: {report.firstActionItem.expectedImpact}
            </p>
          </div>
        )}

        {/* Pro gate teaser */}
        <div className="mb-8 rounded-xl border border-border bg-surface-2 p-5 text-center">
          <p className="text-sm text-text-muted">
            Tam zayıflık analizi, tüm aksiyon maddeleri ve şampiyon önerileri uygulamada görünür.
          </p>
          <p className="mt-1 text-xs text-text-muted/60">
            Ücretsiz: ayda 3 rapor · Pro: sınırsız
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="flex-1 rounded-lg bg-accent py-3 text-center text-sm font-bold text-background transition-opacity hover:opacity-90"
          >
            Kendi AI Koçluk Raporunu Al
          </Link>
          <Link
            href="/"
            className="flex-1 rounded-lg border border-border py-3 text-center text-sm font-semibold text-text hover:bg-surface"
          >
            Daha Fazla Bilgi
          </Link>
        </div>

        {/* Share link display */}
        <div className="mt-6 text-center">
          <p className="text-xs text-text-muted">
            Paylaşım bağlantısı:{" "}
            <span className="font-mono text-text-muted/70">
              {appUrl}/share/report/{params.shareToken}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
