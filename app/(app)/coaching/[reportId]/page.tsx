"use client";

import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { CoachingReportDetail } from "@/domains/coaching/components/CoachingReportDetail";
import { ReportRating } from "@/domains/coaching/components/ReportRating";
import { ShareReportButton } from "@/domains/coaching/components/ShareReportButton";
import { useCoachingReport } from "@/hooks/useCoachingReport";
import { useSubscription } from "@/hooks/useSubscription";

const REPORT_TYPE_LABEL: Record<string, string> = {
  session_review: "Seans Değerlendirmesi",
  champion_focus: "Şampiyon Odağı",
  climb_roadmap: "Çıkış Planı",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  processing: "İşleniyor",
  complete: "Tamamlandı",
  failed: "Başarısız",
};

const STATUS_VARIANT = {
  pending: "warning",
  processing: "warning",
  complete: "success",
  failed: "destructive",
} as const;

export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { data: report, isLoading, error, refetch } = useCoachingReport(reportId);
  const { data: sub } = useSubscription();

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";

  if (isLoading) return <PageSkeleton />;

  if (error || !report) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState
          title="Rapor bulunamadı"
          message={
            error?.message ?? "Bu rapor mevcut değil veya erişim iznin yok."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isPending = report.status === "pending" || report.status === "processing";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader
        title={REPORT_TYPE_LABEL[report.reportType] ?? report.reportType}
        subtitle={`${new Date(report.createdAt).toLocaleString("tr-TR")} · ${report.matchesAnalyzed.length} maç`}
        backHref="/coaching"
        backLabel="Raporlar"
        action={
          <Badge variant={STATUS_VARIANT[report.status] ?? "default"}>
            {STATUS_LABEL[report.status] ?? report.status}
          </Badge>
        }
      />

      {isPending && (
        <div className="flex flex-col items-center justify-center rounded-lg bg-surface-2 py-12 text-center">
          <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-text-muted">
            AI maçlarını analiz ediyor — bu işlem yaklaşık 15–30 saniye sürer.
          </p>
        </div>
      )}

      {report.status === "failed" && (
        <ErrorState
          title="Rapor oluşturulamadı"
          message="AI bu raporu tamamlayamadı. Lütfen yeni bir rapor oluştur."
        />
      )}

      {report.status === "complete" && (
        <>
          <CoachingReportDetail report={report} isPro={isPro} />
          <div className="mt-4">
            <a
              href={`/api/coaching/reports/${report.id}/pdf`}
              download
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:border-accent/50 hover:bg-surface hover:text-text"
            >
              <Download className="h-4 w-4" />
              PDF İndir
            </a>
          </div>
          <ShareReportButton reportId={report.id} />
          <ReportRating reportId={report.id} currentRating={report.userRating} />
        </>
      )}
    </div>
  );
}
